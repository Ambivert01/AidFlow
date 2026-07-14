import { Donation } from "../../models/donor/Donation.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { createWallet, creditWallet } from "../wallet/wallet.service.js";
import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";
import { createAuditLog } from "../audit/audit.service.js";
import { createNotification } from "../notification/notification.service.js";
import { generateHash } from "../../utils/hash.util.js";
import { redisConnection } from "../../config/redis.config.js";
import {
  aggregateCampaignStats,
  aggregateBeneficiaryStats,
  aggregateWalletStats,
  aggregateProofStats,
  aggregateAIInsights,
  aggregateBlockchainStatus,
  aggregateNotifications,
} from "./dashboard.aggregator.js";

/*
NGO DASHBOARD STATS
*/
export const getNgoDashboard = async (ngoId) => {
  const campaigns = await Campaign.find({ createdBy: ngoId });
  const campaignIds = campaigns.map((c) => c._id);

  const [
    totalCampaigns,
    activeCampaigns,
    totalBeneficiaries,
    activeBeneficiaries,
    pendingBeneficiaries,
    pendingDonations,
    donationVolume,
  ] = await Promise.all([
    Campaign.countDocuments({ createdBy: ngoId }),
    Campaign.countDocuments({ createdBy: ngoId, status: "ACTIVE" }),
    Beneficiary.countDocuments({ campaign: { $in: campaignIds } }),
    Beneficiary.countDocuments({
      campaign: { $in: campaignIds },
      status: "ACTIVE",
    }),
    Beneficiary.countDocuments({
      campaign: { $in: campaignIds },
      status: { $in: ["PENDING", "UNDER_REVIEW", "MANUAL_REVIEW"] },
    }),
    Donation.countDocuments({
      campaign: { $in: campaignIds },
      status: "PENDING_NGO_REVIEW",
    }),
    Donation.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return BaseService.success({
    totalCampaigns,
    activeCampaigns,
    totalBeneficiaries,
    activeBeneficiaries,
    pendingBeneficiaries,
    pendingDonations,
    totalDonated: donationVolume[0]?.total || 0,
  });
};

/*
GET PENDING DONATIONS FOR NGO
donations in PENDING_NGO_REVIEW, HIGH_RISK_ESCALATED, PAYMENT_SUCCESS, or
APPROVED_BY_GOVT for NGO's campaigns.
APPROVED_BY_GOVT is included because it's a "cleared, continue the normal
flow" state, not a terminal one - a donation that was escalated to a
government reviewer and approved must come back to the NGO for beneficiary
assignment exactly like a normal PENDING_NGO_REVIEW donation would.
Previously this list didn't include it, so government-approved escalated
donations vanished from every NGO queue and could never be allocated to a
beneficiary - the donor's money was stuck with no way forward.
*/
export const getPendingDonations = async (ngoId) => {
  const campaigns = await Campaign.find({ createdBy: ngoId }).select("_id");
  const campaignIds = campaigns.map((c) => c._id);

  const donations = await Donation.find({
    campaign: { $in: campaignIds },
    status: {
      $in: ["PENDING_NGO_REVIEW", "HIGH_RISK_ESCALATED", "PAYMENT_SUCCESS", "APPROVED_BY_GOVT"],
    },
  })
    .populate("donor", "name email")
    .populate("campaign", "title disasterType policySnapshot")
    .sort({ createdAt: -1 });

  return BaseService.success(donations);
};

/*
GET NGO BENEFICIARIES (all campaigns or filtered)
*/
export const getNgoBeneficiaries = async (ngoId, query = {}) => {
  const campaigns = await Campaign.find({ createdBy: ngoId }).select("_id");
  const campaignIds = campaigns.map((c) => c._id);

  const filter = { campaign: { $in: campaignIds } };
  if (query.status) filter.status = query.status;

  const beneficiaries = await Beneficiary.find(filter)
    .populate("campaign", "title disasterType")
    .sort({ createdAt: -1 });

  return BaseService.success(beneficiaries);
};

/*
ASSIGN DONATION TO BENEFICIARY
sets donation.beneficiary — prerequisite before approval
*/
export const assignDonationToBeneficiary = async (
  donationId,
  beneficiaryId,
  ngoId,
) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  // Verify NGO owns this campaign
  if (donation.campaign.createdBy.toString() !== ngoId.toString()) {
    throw new AppError("Unauthorized: not your campaign", 403);
  }

  if (
    !["PENDING_NGO_REVIEW", "HIGH_RISK_ESCALATED", "PAYMENT_SUCCESS", "APPROVED_BY_GOVT"].includes(
      donation.status,
    )
  ) {
    throw new AppError("Donation is not in a reviewable state", 400);
  }

  const beneficiary = await Beneficiary.findById(beneficiaryId);
  if (!beneficiary) throw new AppError("Beneficiary not found", 404);
  if (!["APPROVED", "ACTIVE"].includes(beneficiary.status)) {
    throw new AppError(
      "Beneficiary must be approved before receiving funds",
      400,
    );
  }

  donation.beneficiary = beneficiaryId;
  await donation.save();

  return BaseService.updated(donation);
};

/*
APPROVE DONATION — creates wallet for beneficiary
*/
export const approveDonation = async (donationId, ngoId) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.campaign.createdBy.toString() !== ngoId.toString()) {
    throw new AppError("Unauthorized: not your campaign", 403);
  }

  if (!donation.beneficiary) {
    throw new AppError("Assign a beneficiary before approving", 400);
  }

  if (
    !["PENDING_NGO_REVIEW", "HIGH_RISK_ESCALATED", "PAYMENT_SUCCESS", "APPROVED_BY_GOVT"].includes(
      donation.status,
    )
  ) {
    throw new AppError("Donation is not in a reviewable state", 400);
  }

  // Create (or top up) the beneficiary's wallet for this campaign.
  // A beneficiary can receive more than one donation on the same campaign
  // (multiple donors, or an NGO allocating a second donation to someone with
  // high need) - once their first donation is approved, their status moves
  // to ACTIVE and createWallet() would reject them (it only accepts status
  // APPROVED). Route to creditWallet() for that case instead of failing.
  const existingWallet = await Wallet.findOne({
    beneficiary: donation.beneficiary,
    campaign: donation.campaign._id,
  });

  let wallet;
  if (existingWallet && existingWallet.status === "ACTIVE") {
    const creditResult = await creditWallet(
      existingWallet._id,
      donation.amount,
      ngoId,
    );
    wallet = creditResult.data || creditResult;
  } else {
    wallet = await createWallet({
      beneficiaryId: donation.beneficiary,
      campaignId: donation.campaign._id,
      donation: donation._id,
      createdBy: ngoId,
      amount: donation.amount,
      policy: donation.policySnapshot || donation.campaign.policySnapshot,
      jobIdHash: generateHash({
        type: "WALLET_FROM_DONATION",
        donationId: donation._id.toString(),
        timestamp: Date.now(),
      }),
    });
  }

  donation.status = "READY_FOR_USE";
  donation.wallet = wallet._id;
  donation.walletCreated = true;
  await donation.save();

  // NOTE: campaign totalAllocated / totalWalletsCreated are already updated
  // inside createWallet()/creditWallet() themselves - incrementing them
  // again here would double-count every approved donation.

  // Update beneficiary status to ACTIVE
  await Beneficiary.findByIdAndUpdate(donation.beneficiary, {
    status: "ACTIVE",
  });

  await createAuditLog({
    eventType: "DONATION_NGO_APPROVED",
    entityType: "Donation",
    entityId: donation._id,
    actorRole: "NGO",
    payload: {
      walletId: wallet._id,
      beneficiaryId: donation.beneficiary,
      amount: donation.amount,
    },
  });

  try {
    await createNotification({
      userId: donation.donor,
      role: "DONOR",
      type: "DONATION_SUCCESS",
      title: "Donation Allocated",
      message: `Your ₹${donation.amount} donation to "${donation.campaign.title}" has been allocated to a beneficiary and is ready to be spent.`,
      entityType: "Donation",
      entityId: donation._id.toString(),
      channels: ["IN_APP", "EMAIL"],
      priority: "NORMAL",
    });
  } catch (error) {
    // Notification failure should never block the donation approval itself
    console.error("Failed to send donation-approved notification:", error);
  }

  return BaseService.updated({ donation, wallet });
};

/*
REJECT DONATION
*/
export const rejectDonation = async (donationId, ngoId, reason) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.campaign.createdBy.toString() !== ngoId.toString()) {
    throw new AppError("Unauthorized: not your campaign", 403);
  }

  donation.status = "REJECTED";
  donation.reviewReason = reason || "Rejected by NGO";
  await donation.save();

  await createAuditLog({
    eventType: "DONATION_NGO_REJECTED",
    entityType: "Donation",
    entityId: donation._id,
    actorRole: "NGO",
    payload: { reason },
  });

  try {
    await createNotification({
      userId: donation.donor,
      role: "DONOR",
      type: "DONATION_REJECTED",
      title: "Donation Rejected",
      message: `Your ₹${donation.amount} donation to "${donation.campaign.title}" was rejected by the NGO. Reason: ${donation.reviewReason}`,
      entityType: "Donation",
      entityId: donation._id.toString(),
      channels: ["IN_APP", "EMAIL"],
      priority: "HIGH",
    });
  } catch (error) {
    console.error("Failed to send donation-rejected notification:", error);
  }

  return BaseService.updated(donation);
};

/*
GET NGO CAMPAIGNS
*/
export const getNgoCampaigns = async (ngoId) => {
  const campaigns = await Campaign.find({ createdBy: ngoId }).sort({
    createdAt: -1,
  });
  return BaseService.success(campaigns);
};

/*
ALLOCATE DONATION TO BENEFICIARY (legacy — kept for workflow engine)
*/
export const allocateDonationToBeneficiary = async (ngoId, data) => {
  await assignDonationToBeneficiary(data.donationId, data.beneficiaryId, ngoId);
  return approveDonation(data.donationId, ngoId);
};

/*
ENHANCED NGO DASHBOARD
Aggregates data from all modules for unified dashboard view
*/
export const getEnhancedNgoDashboard = async (ngoId) => {
  const startTime = Date.now();

  try {
    // Step 1: Check Redis cache for existing dashboard data
    const cacheKey = `dashboard:ngo:${ngoId}`;

    try {
      const cachedData = await redisConnection.get(cacheKey);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // Update metadata to indicate cache hit
        parsedData.metadata.cacheHit = true;
        parsedData.metadata.queryTimeMs = Date.now() - startTime;
        return BaseService.success(parsedData);
      }
    } catch (cacheError) {
      // Log cache error but continue with normal operation (graceful degradation)
      console.error("Redis cache read error:", cacheError);
    }

    // Step 2: Fetch all campaigns created by the NGO user
    const campaigns = await Campaign.find({ createdBy: ngoId }).select("_id");
    const campaignIds = campaigns.map((c) => c._id);

    // If no campaigns, return empty dashboard
    if (campaignIds.length === 0) {
      const emptyDashboard = {
        overview: {
          ngoId: ngoId, // Include ngoId for trust score fetching
          totalCampaigns: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          pendingApprovalCampaigns: 0,
          totalFundsReceived: 0,
          totalFundsAllocated: 0,
          totalFundsSpent: 0,
          remainingFunds: 0,
          pendingProofsCount: 0,
          totalBeneficiaries: 0,
        },
        campaigns: [],
        beneficiaries: {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          manualReview: 0,
          fraudFlagged: 0,
          highRisk: 0,
          byStatus: {},
          byAIDecision: {},
        },
        wallets: {
          totalCreated: 0,
          totalAllocated: 0,
          totalSpent: 0,
          remainingBalance: 0,
          active: 0,
          suspended: 0,
          expired: 0,
          highRisk: 0,
          byCampaign: [],
          byCategory: {},
        },
        proofs: {
          total: 0,
          pending: 0,
          aiVerified: 0,
          approved: 0,
          rejected: 0,
          manualReview: 0,
          highRisk: 0,
          byType: {},
          recent: [],
        },
        aiInsights: {
          activeFraudAlerts: 0,
          alertsBySeverity: {},
          recentDecisions: [],
          criticalAlerts: [],
          decisionsByType: {},
        },
        workflow: {
          stages: [],
          pendingActions: 0,
        },
        blockchain: {
          totalAnchored: 0,
          pendingAnchor: 0,
          lastAnchorTimestamp: null,
          networkName: "N/A",
          byCampaign: [],
          recentTransactions: [],
          delayWarning: false,
        },
        notifications: [],
        metadata: {
          dataFreshness: new Date(),
          cacheHit: false,
          queryTimeMs: Date.now() - startTime,
        },
      };
      return BaseService.success(emptyDashboard);
    }

    // Step 3: Execute all aggregator functions in parallel
    const [
      campaignStats,
      beneficiaryStats,
      walletStats,
      proofStats,
      aiInsights,
      blockchainStatus,
      notifications,
    ] = await Promise.allSettled([
      aggregateCampaignStats(campaignIds),
      aggregateBeneficiaryStats(campaignIds),
      aggregateWalletStats(campaignIds),
      aggregateProofStats(campaignIds),
      aggregateAIInsights(campaignIds),
      aggregateBlockchainStatus(campaignIds),
      aggregateNotifications(ngoId),
    ]);

    // Step 4: Extract results and handle partial failures
    const getCampaignData = () => {
      if (campaignStats.status === "fulfilled") {
        return campaignStats.value;
      }
      console.error("Campaign stats aggregation failed:", campaignStats.reason);
      return {
        total: 0,
        active: 0,
        completed: 0,
        pendingApproval: 0,
        totalDonated: 0,
        totalAllocated: 0,
        totalSpent: 0,
        remainingFunds: 0,
        campaigns: [],
        error: true,
      };
    };

    const getBeneficiaryData = () => {
      if (beneficiaryStats.status === "fulfilled") {
        return beneficiaryStats.value;
      }
      console.error(
        "Beneficiary stats aggregation failed:",
        beneficiaryStats.reason,
      );
      return {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        manualReview: 0,
        fraudFlagged: 0,
        highRisk: 0,
        byStatus: {},
        byAIDecision: {},
        error: true,
      };
    };

    const getWalletData = () => {
      if (walletStats.status === "fulfilled") {
        return walletStats.value;
      }
      console.error("Wallet stats aggregation failed:", walletStats.reason);
      return {
        totalCreated: 0,
        totalAllocated: 0,
        totalSpent: 0,
        remainingBalance: 0,
        active: 0,
        suspended: 0,
        expired: 0,
        highRisk: 0,
        byCampaign: [],
        byCategory: {},
        error: true,
      };
    };

    const getProofData = () => {
      if (proofStats.status === "fulfilled") {
        return proofStats.value;
      }
      console.error("Proof stats aggregation failed:", proofStats.reason);
      return {
        total: 0,
        pending: 0,
        aiVerified: 0,
        approved: 0,
        rejected: 0,
        manualReview: 0,
        highRisk: 0,
        byType: {},
        recent: [],
        error: true,
      };
    };

    const getAIInsightsData = () => {
      if (aiInsights.status === "fulfilled") {
        return aiInsights.value;
      }
      console.error("AI insights aggregation failed:", aiInsights.reason);
      return {
        activeFraudAlerts: 0,
        alertsBySeverity: {},
        recentDecisions: [],
        criticalAlerts: [],
        decisionsByType: {},
        error: true,
      };
    };

    const getBlockchainData = () => {
      if (blockchainStatus.status === "fulfilled") {
        return blockchainStatus.value;
      }
      console.error(
        "Blockchain status aggregation failed:",
        blockchainStatus.reason,
      );
      return {
        totalAnchored: 0,
        pendingAnchor: 0,
        lastAnchorTimestamp: null,
        networkName: "N/A",
        byCampaign: [],
        recentTransactions: [],
        delayWarning: false,
        error: true,
      };
    };

    const getNotificationsData = () => {
      if (notifications.status === "fulfilled") {
        return notifications.value;
      }
      console.error("Notifications aggregation failed:", notifications.reason);
      return [];
    };

    // Extract data from settled promises
    const campaignData = getCampaignData();
    const beneficiaryData = getBeneficiaryData();
    const walletData = getWalletData();
    const proofData = getProofData();
    const aiInsightsData = getAIInsightsData();
    const blockchainData = getBlockchainData();
    const notificationsData = getNotificationsData();

    // Step 5: Calculate overview statistics
    const overview = {
      ngoId: ngoId, // Include ngoId for trust score fetching
      totalCampaigns: campaignData.total,
      activeCampaigns: campaignData.active,
      completedCampaigns: campaignData.completed,
      pendingApprovalCampaigns: campaignData.pendingApproval,
      totalFundsReceived: campaignData.totalDonated,
      totalFundsAllocated: walletData.totalAllocated,
      totalFundsSpent: walletData.totalSpent,
      remainingFunds: campaignData.remainingFunds,
      pendingProofsCount: proofData.pending,
      totalBeneficiaries: beneficiaryData.total,
    };

    // Step 6: Workflow status (placeholder for now as per design)
    const workflow = {
      stages: [
        {
          name: "Campaign",
          count: campaignData.total,
          errors: 0,
          delays: 0,
          avgProcessingTime: 0,
        },
        {
          name: "Beneficiaries",
          count: beneficiaryData.total,
          errors: 0,
          delays: 0,
          avgProcessingTime: 0,
        },
        {
          name: "Wallet Allocation",
          count: walletData.totalCreated,
          errors: 0,
          delays: 0,
          avgProcessingTime: 0,
        },
        {
          name: "Spending",
          count: walletData.totalCreated,
          errors: 0,
          delays: 0,
          avgProcessingTime: 0,
        },
        {
          name: "Proof Upload",
          count: proofData.total,
          errors: 0,
          delays: 0,
          avgProcessingTime: 0,
        },
        {
          name: "AI Validation",
          count: proofData.aiVerified + proofData.approved,
          errors: 0,
          delays: 0,
          avgProcessingTime: 0,
        },
      ],
      pendingActions: beneficiaryData.pending + proofData.pending,
    };

    // Step 7: Combine all data into unified response
    const queryTimeMs = Date.now() - startTime;

    const dashboardData = {
      overview,
      campaigns: campaignData.campaigns,
      beneficiaries: beneficiaryData,
      wallets: walletData,
      proofs: proofData,
      aiInsights: aiInsightsData,
      workflow,
      blockchain: blockchainData,
      notifications: notificationsData,
      metadata: {
        dataFreshness: new Date(),
        cacheHit: false,
        queryTimeMs,
      },
    };

    // Step 8: Store aggregated data in Redis cache
    try {
      await redisConnection.setex(
        cacheKey,
        300, // TTL: 5 minutes (300 seconds)
        JSON.stringify(dashboardData),
      );
    } catch (cacheError) {
      // Log cache error but continue with normal operation (graceful degradation)
      console.error("Redis cache write error:", cacheError);
    }

    return BaseService.success(dashboardData);
  } catch (error) {
    console.error("Error in getEnhancedNgoDashboard:", error);
    throw error;
  }
};
