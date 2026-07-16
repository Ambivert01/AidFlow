import { User } from "../../models/auth/User.model.js";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Merchant } from "../../models/merchant/Merchant.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { FraudAlert } from "../../models/governance/FraudAlert.model.js";
import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";
import { createAuditLog } from "../audit/audit.service.js";
import mongoose from "mongoose";

/*
PLATFORM STATS
*/
export const getAdminStats = async () => {
  const [
    totalUsers,
    totalNGOs,
    totalMerchants,
    totalDonations,
    totalAuditLogs,
    pendingRequests,
    donationVolume,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    User.countDocuments({ role: "NGO", verificationStatus: "APPROVED" }),
    User.countDocuments({ role: "MERCHANT", verificationStatus: "APPROVED" }),
    Donation.countDocuments(),
    AuditLog.countDocuments(),
    User.countDocuments({ verificationStatus: "PENDING" }),
    Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
  ]);

  return BaseService.success({
    totalUsers,
    totalNGOs,
    totalMerchants,
    totalDonations,
    totalAuditLogs,
    pendingRequests,
    totalDonationVolume: donationVolume[0]?.total || 0,
  });
};

/*
PENDING ACCESS REQUESTS
users with verificationStatus PENDING
*/
export const getPendingRequests = async () => {
  const users = await User.find({ verificationStatus: "PENDING" })
    .select("name email role createdAt")
    .sort({ createdAt: -1 });

  return BaseService.success(users);
};

/*
APPROVE USER
for NGO/MERCHANT/GOVERNMENT — also creates Merchant profile if role is MERCHANT
*/
export const approveUser = async (userId, adminId, extraData = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError("Invalid user id", 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.verificationStatus === "APPROVED")
    return BaseService.success(user, "Already approved");

  user.verificationStatus = "APPROVED";
  user.approvedBy = adminId;
  await user.save();

  // Auto-create Merchant profile when admin approves a MERCHANT user
  if (user.role === "MERCHANT") {
    const existing = await Merchant.findOne({ user: user._id });
    if (!existing) {
      await Merchant.create({
        user: user._id,
        shopName: extraData.shopName || `${user.name}'s Shop`,
        category: extraData.category || "OTHER",
        location: extraData.location || {},
        status: "ACTIVE",
        approvedBy: adminId,
        approvedAt: new Date(),
      });
    }
  }

  return BaseService.updated(user);
};

/*
REJECT USER
*/
export const rejectUser = async (userId, adminId, reason) => {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new AppError("Invalid user id", 400);

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.verificationStatus = "REJECTED";
  user.rejectionReason = reason || "Did not meet KYC requirements";
  await user.save();

  return BaseService.updated(user);
};

/*
GET ALL USERS (with filters)
*/
export const getAllUsers = async (query = {}) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.verificationStatus = query.status;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .limit(100);

  return BaseService.success(users);
};

/*
TOGGLE USER ACTIVE STATUS
*/
export const toggleUserActive = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  user.isActive = !user.isActive;
  await user.save();

  return BaseService.updated(user);
};

/*
GET ALL MERCHANTS
*/
export const getAllMerchants = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;

  const merchants = await Merchant.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return BaseService.success(merchants);
};

/*
UPDATE MERCHANT (category / status)
*/
export const updateMerchant = async (merchantId, data) => {
  const merchant = await Merchant.findByIdAndUpdate(merchantId, data, {
    new: true,
  });
  if (!merchant) throw new AppError("Merchant not found", 404);
  return BaseService.updated(merchant);
};

/*
GET AUDIT LOGS (admin view)
*/
export const getAuditLogs = async (query = {}) => {
  const filter = {};
  if (query.eventCategory) filter.eventCategory = query.eventCategory;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.actorRole) filter["actor.role"] = query.actorRole;

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200);

  return BaseService.success(logs);
};

/*
FREEZE WALLET (admin)
*/
export const freezeWallet = async (walletId, reason, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(walletId))
    throw new AppError("Invalid wallet id", 400);

  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError("Wallet not found", 404);

  wallet.status = "SUSPENDED";
  wallet.freezeReason = reason;
  wallet.frozenBy = adminId;
  wallet.frozenAt = new Date();
  await wallet.save();

  return BaseService.updated(wallet);
};

/*
BAN MERCHANT (admin)
*/
export const banMerchant = async (merchantId, reason) => {
  if (!mongoose.Types.ObjectId.isValid(merchantId))
    throw new AppError("Invalid merchant id", 400);

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new AppError("Merchant not found", 404);

  merchant.status = "BANNED";
  merchant.suspendedReason = reason;
  merchant.bannedAt = new Date();
  await merchant.save();

  return BaseService.updated(merchant);
};

/*
GET FRAUD ALERTS
*/
export const getFraudAlerts = async () => {
  const alerts = await FraudAlert.find({ status: "OPEN" }).sort({
    createdAt: -1,
  });
  return BaseService.success(alerts);
};

/*
GET PENDING CAMPAIGNS
Query campaigns with status PENDING_APPROVAL, populate NGO details, sort by submittedAt
*/
export const getPendingCampaigns = async () => {
  const campaigns = await Campaign.find({ status: "PENDING_APPROVAL" })
    .populate("createdBy", "name email profile")
    .sort({ submittedAt: -1 });

  return BaseService.success(campaigns);
};

/*
APPROVE CAMPAIGN
Validate, change to ACTIVE, set approvedBy/approvedAt, create audit log, notify NGO
*/
export const approveCampaign = async (campaignId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId))
    throw new AppError("Invalid campaign id", 400);

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (campaign.status !== "PENDING_APPROVAL") {
    throw new AppError("Campaign is not pending approval", 400);
  }

  // Update campaign status to ACTIVE
  campaign.status = "ACTIVE";
  campaign.approvedBy = adminId;
  campaign.approvedAt = new Date();
  await campaign.save();

  // Create audit log entry
  await createAuditLog({
    eventType: "CAMPAIGN_APPROVED",
    eventCategory: "CAMPAIGN",
    entityType: "Campaign",
    entityId: campaign._id.toString(),
    jobIdHash: campaign.jobIdHash,
    campaignId: campaign._id,
    actorId: adminId,
    actorRole: "ADMIN",
    payload: {
      campaignTitle: campaign.title,
      approvedBy: adminId,
      approvedAt: campaign.approvedAt,
    },
  });

  // Send notification to NGO
  const { createNotification } =
    await import("../notification/notification.service.js");
  await createNotification({
    userId: campaign.createdBy,
    role: "NGO",
    type: "CAMPAIGN_APPROVED",
    title: "Campaign Approved",
    message: `Your campaign "${campaign.title}" has been approved and is now active.`,
    entityType: "Campaign",
    entityId: campaign._id.toString(),
    priority: "HIGH",
  });

  // Initialize campaign workflow
  const workflowEngine = (await import("../../engines/workflow.engine.js"))
    .default;
  await workflowEngine.initializeCampaignWorkflow(campaign._id.toString());

  return BaseService.updated(campaign);
};

/*
REJECT CAMPAIGN
Validate, change to REJECTED, set rejection fields, create audit log, notify NGO
*/
export const rejectCampaign = async (campaignId, adminId, rejectionReason) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId))
    throw new AppError("Invalid campaign id", 400);

  if (!rejectionReason || rejectionReason.trim() === "") {
    throw new AppError("Rejection reason is required", 400);
  }

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (campaign.status !== "PENDING_APPROVAL") {
    throw new AppError("Campaign is not pending approval", 400);
  }

  // Update campaign status to REJECTED
  campaign.status = "REJECTED";
  campaign.rejectionReason = rejectionReason;
  campaign.rejectedBy = adminId;
  campaign.rejectedAt = new Date();
  await campaign.save();

  // Create audit log entry
  await createAuditLog({
    eventType: "CAMPAIGN_REJECTED",
    eventCategory: "CAMPAIGN",
    entityType: "Campaign",
    entityId: campaign._id.toString(),
    jobIdHash: campaign.jobIdHash,
    campaignId: campaign._id,
    actorId: adminId,
    actorRole: "ADMIN",
    payload: {
      campaignTitle: campaign.title,
      rejectedBy: adminId,
      rejectedAt: campaign.rejectedAt,
      rejectionReason: rejectionReason,
    },
  });

  // Send notification to NGO with rejection reason
  const { createNotification } =
    await import("../notification/notification.service.js");
  await createNotification({
    userId: campaign.createdBy,
    role: "NGO",
    type: "CAMPAIGN_REJECTED",
    title: "Campaign Rejected",
    message: `Your campaign "${campaign.title}" has been rejected. Reason: ${rejectionReason}`,
    entityType: "Campaign",
    entityId: campaign._id.toString(),
    priority: "HIGH",
  });

  return BaseService.updated(campaign);
};

/*
AI OVERRIDE SYSTEM
Admin can override AI decisions (fraud detection, risk scoring, etc.)
*/
export const overrideAIDecision = async (data, adminId) => {
  const { entityType, entityId, decisionType, override, reason } = data;

  if (!entityType || !entityId || !decisionType || !override) {
    throw new AppError("Missing required fields", 400);
  }

  // Import AIDecisionLog model
  const { AIDecisionLog } =
    await import("../../models/system/AIDecisionLog.model.js");

  // Best-effort: log the override against a matching AI decision record if
  // one exists. This lookup used to be a hard requirement - but the only
  // code that ever writes AIDecisionLog (ai.worker.js) only logs
  // entityType "CAMPAIGN" with decisionType "CAMPAIGN_RISK_EVALUATION",
  // which isn't even one of the 4 decision types this form offers. Treating
  // a missing log as fatal meant this feature 404'd for every possible
  // input. The actual override (below) is what matters functionally; the
  // log is a nice-to-have audit trail on top of it, not a prerequisite.
  const aiDecision = await AIDecisionLog.findOne({
    entityType,
    entityId,
    decisionType,
  }).sort({ createdAt: -1 });

  if (aiDecision) {
    aiDecision.override = {
      overridden: true,
      overriddenBy: adminId,
      overriddenAt: new Date(),
      reason: reason || "Admin override",
      originalDecision: aiDecision.decision,
      newDecision: override,
    };
    await aiDecision.save();
  }

  // Apply the override based on entity type
  if (entityType === "DONATION") {
    const donation = await Donation.findById(entityId);
    if (!donation) throw new AppError("Donation not found", 404);
    donation.aiDecision = override;
    donation.aiOverride = true;
    await donation.save();
  } else if (entityType === "FRAUD_ALERT") {
    const { FraudAlert } =
      await import("../../models/governance/FraudAlert.model.js");
    const alert = await FraudAlert.findById(entityId);
    if (!alert) throw new AppError("Fraud alert not found", 404);
    alert.status =
      override === "APPROVED" ? "FALSE_POSITIVE" : "CONFIRMED_FRAUD";
    alert.investigation.decision =
      override === "APPROVED" ? "DISMISSED" : "CONFIRMED";
    alert.investigation.resolvedAt = new Date();
    await alert.save();
  } else if (entityType === "BENEFICIARY") {
    const beneficiary = await Beneficiary.findById(entityId);
    if (!beneficiary) throw new AppError("Beneficiary not found", 404);
    beneficiary.status = override === "APPROVED" ? "APPROVED" : "BLOCKED";
    beneficiary.verificationHistory.push({
      action:
        override === "APPROVED"
          ? "ADMIN_OVERRIDE_APPROVED"
          : "ADMIN_OVERRIDE_BLOCKED",
      performedBy: adminId,
      reason: reason || "Admin override of AI decision",
      timestamp: new Date(),
    });
    await beneficiary.save();
  } else {
    // CAMPAIGN / MERCHANT: no defined override semantics yet (what
    // "override" concretely changes on these entities isn't specified
    // anywhere in the docs this audit worked from), so this intentionally
    // stops short of guessing at behavior for money- or account-affecting
    // fields. The audit log below still records the attempt for visibility.
    throw new AppError(
      `AI override for entity type ${entityType} is not yet implemented`,
      501,
    );
  }

  // Create audit log
  await createAuditLog({
    eventType: "AI_DECISION_OVERRIDDEN",
    eventCategory: "SYSTEM",
    entityType,
    entityId,
    actorId: adminId,
    actorRole: "ADMIN",
    payload: {
      decisionType,
      originalDecision: aiDecision?.decision,
      newDecision: override,
      reason,
    },
  });

  return BaseService.success({
    message: "AI decision overridden successfully",
    aiDecision,
  });
};

/*
BULK APPROVE USERS
Approve multiple users at once
*/
export const bulkApproveUsers = async (userIds, adminId) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError("User IDs array is required", 400);
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const userId of userIds) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        results.failed.push({ userId, reason: "User not found" });
        continue;
      }

      if (user.verificationStatus === "APPROVED") {
        results.failed.push({ userId, reason: "Already approved" });
        continue;
      }

      user.verificationStatus = "APPROVED";
      user.approvedBy = adminId;
      await user.save();

      // Auto-create Merchant profile if needed
      if (user.role === "MERCHANT") {
        const existing = await Merchant.findOne({ user: user._id });
        if (!existing) {
          await Merchant.create({
            user: user._id,
            shopName: `${user.name}'s Shop`,
            category: "OTHER",
            status: "ACTIVE",
            approvedBy: adminId,
            approvedAt: new Date(),
          });
        }
      }

      results.success.push(userId);
    } catch (error) {
      results.failed.push({ userId, reason: error.message });
    }
  }

  // Create audit log
  await createAuditLog({
    eventType: "BULK_USER_APPROVAL",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: adminId.toString(),
    actorId: adminId,
    actorRole: "ADMIN",
    payload: {
      totalUsers: userIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
    },
  });

  return BaseService.success(results);
};

/*
BULK REJECT USERS
Reject multiple users at once
*/
export const bulkRejectUsers = async (userIds, adminId, reason) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError("User IDs array is required", 400);
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const userId of userIds) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        results.failed.push({ userId, reason: "User not found" });
        continue;
      }

      user.verificationStatus = "REJECTED";
      user.rejectionReason = reason || "Did not meet KYC requirements";
      await user.save();

      results.success.push(userId);
    } catch (error) {
      results.failed.push({ userId, reason: error.message });
    }
  }

  // Create audit log
  await createAuditLog({
    eventType: "BULK_USER_REJECTION",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: adminId.toString(),
    actorId: adminId,
    actorRole: "ADMIN",
    payload: {
      totalUsers: userIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      reason,
    },
  });

  return BaseService.success(results);
};

/*
GET SYSTEM HEALTH
Returns system health metrics
*/
export const getSystemHealth = async () => {
  const [
    dbStatus,
    totalUsers,
    activeUsers,
    totalDonations,
    totalCampaigns,
    activeCampaigns,
    openFraudCases,
  ] = await Promise.all([
    mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Donation.countDocuments(),
    Campaign.countDocuments(),
    Campaign.countDocuments({ status: "ACTIVE" }),
    FraudAlert.countDocuments({ status: "OPEN" }),
  ]);

  return BaseService.success({
    database: dbStatus,
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    donations: {
      total: totalDonations,
    },
    campaigns: {
      total: totalCampaigns,
      active: activeCampaigns,
    },
    fraud: {
      openCases: openFraudCases,
    },
    timestamp: new Date(),
  });
};

/*
GET BLOCKCHAIN ANCHORS
Returns blockchain anchor records for verification
*/
export const getBlockchainAnchors = async (query = {}) => {
  const filter = {
    "blockchainAnchor.txHash": { $exists: true, $ne: null },
  };

  if (query.entityType) filter.entityType = query.entityType;

  const anchors = await AuditLog.find(filter)
    .select("blockchainAnchor entityType entityId eventType createdAt")
    .sort({ "blockchainAnchor.anchoredAt": -1 })
    .limit(100);

  return BaseService.success(anchors);
};
