import { Donation } from "../../models/donor/Donation.model.js";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { FraudAlert } from "../../models/governance/FraudAlert.model.js";
import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";
import { createAuditLog } from "../audit/audit.service.js";
import { createNotification } from "../notification/notification.service.js";

/*
GOVERNMENT OVERVIEW STATS
*/
export const getOverview = async () => {
  const [
    activeWallets,
    frozenWallets,
    escalatedDonations,
    activeCampaigns,
    walletStats,
    frozenStats,
  ] = await Promise.all([
    Wallet.countDocuments({ status: "ACTIVE" }),
    Wallet.countDocuments({ status: "SUSPENDED" }),
    Donation.countDocuments({ status: "HIGH_RISK_ESCALATED" }),
    Campaign.countDocuments({ status: "ACTIVE" }),
    Wallet.aggregate([{ $match: { status: "ACTIVE" } }, { $group: { _id: null, total: { $sum: "$balance" } } }]),
    Wallet.aggregate([{ $match: { status: "SUSPENDED" } }, { $group: { _id: null, total: { $sum: "$balance" } } }]),
  ]);

  return BaseService.success({
    activeWallets,
    frozenWallets,
    escalatedDonations,
    activeCampaigns,
    totalDisbursed: walletStats[0]?.total || 0,
    frozenAmount: frozenStats[0]?.total || 0,
  });
};

/*
GET ESCALATED DONATIONS (HIGH_RISK)
*/
export const getEscalatedDonations = async () => {
  const donations = await Donation.find({ status: "HIGH_RISK_ESCALATED" })
    .populate("donor", "name email")
    .populate("campaign", "title disasterType location")
    .sort({ createdAt: -1 });

  return BaseService.success(donations);
};

/*
APPROVE ESCALATED DONATION
*/
export const approveDonation = async (donationId, govId) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  donation.status = "APPROVED_BY_GOVT";
  donation.governmentReview = {
    escalated: true,
    decision: "APPROVED",
    reviewedBy: govId,
    reviewedAt: new Date(),
  };
  await donation.save();

  await createAuditLog({
    eventType: "DONATION_GOVT_APPROVED",
    entityType: "Donation",
    entityId: donation._id,
    actorRole: "GOVERNMENT",
    payload: { govId },
  });

  try {
    await createNotification({
      userId: donation.donor,
      role: "DONOR",
      type: "DONATION_SUCCESS",
      title: "Donation Cleared by Government Review",
      message: `Your ₹${donation.amount} donation to "${donation.campaign.title}" passed government review and is now with the NGO for beneficiary allocation.`,
      entityType: "Donation",
      entityId: donation._id.toString(),
      channels: ["IN_APP", "EMAIL"],
      priority: "NORMAL",
    });
    await createNotification({
      userId: donation.campaign.createdBy,
      role: "NGO",
      type: "DONATION_SUCCESS",
      title: "Escalated Donation Cleared - Action Needed",
      message: `A ₹${donation.amount} donation to "${donation.campaign.title}" was cleared by government review and is ready for you to assign to a beneficiary.`,
      entityType: "Donation",
      entityId: donation._id.toString(),
      channels: ["IN_APP", "EMAIL"],
      priority: "HIGH",
    });
  } catch (error) {
    console.error("Failed to send govt-approval notifications:", error);
  }

  return BaseService.updated(donation);
};

/*
REJECT ESCALATED DONATION
*/
export const rejectDonation = async (donationId, govId, reason) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  donation.status = "REJECTED_BY_GOVT";
  donation.governmentReview = {
    escalated: true,
    decision: "REJECTED",
    reviewedBy: govId,
    reviewedAt: new Date(),
    reason,
  };
  await donation.save();

  await createAuditLog({
    eventType: "DONATION_GOVT_REJECTED",
    entityType: "Donation",
    entityId: donation._id,
    actorRole: "GOVERNMENT",
    payload: { reason },
  });

  try {
    await createNotification({
      userId: donation.donor,
      role: "DONOR",
      type: "DONATION_REJECTED",
      title: "Donation Rejected by Government Review",
      message: `Your ₹${donation.amount} donation to "${donation.campaign.title}" was rejected during government review. Reason: ${reason || "Not specified"}`,
      entityType: "Donation",
      entityId: donation._id.toString(),
      channels: ["IN_APP", "EMAIL"],
      priority: "HIGH",
    });
  } catch (error) {
    console.error("Failed to send govt-rejection notification:", error);
  }

  return BaseService.updated(donation);
};

/*
GET ALL WALLETS (paginated, filterable)
*/
export const getWallets = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;

  const wallets = await Wallet.find(filter)
    .populate("beneficiary", "name phone")
    .populate("campaign", "title disasterType")
    .sort({ createdAt: -1 })
    .limit(100);

  return BaseService.success(wallets);
};

/*
FREEZE WALLET (government)
*/
export const freezeWallet = async (walletId, reason, govId) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError("Wallet not found", 404);

  wallet.status = "SUSPENDED";
  wallet.freezeReason = reason;
  wallet.frozenBy = govId;
  wallet.frozenAt = new Date();
  await wallet.save();

  await createAuditLog({
    eventType: "WALLET_FROZEN",
    entityType: "Wallet",
    entityId: wallet._id,
    actorRole: "GOVERNMENT",
    payload: { reason },
  });

  return BaseService.updated(wallet);
};

/*
UNFREEZE WALLET (government)
*/
export const unfreezeWallet = async (walletId, govId) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError("Wallet not found", 404);

  if (wallet.status !== "SUSPENDED") {
    throw new AppError(
      `Cannot unfreeze a wallet with status ${wallet.status}. Only SUSPENDED wallets can be unfrozen.`,
      400,
    );
  }

  wallet.status = "ACTIVE";
  wallet.freezeReason = null;
  wallet.frozenBy = null;
  wallet.frozenAt = null;
  await wallet.save();

  await createAuditLog({
    eventType: "WALLET_UNFROZEN",
    entityType: "Wallet",
    entityId: wallet._id,
    actorRole: "GOVERNMENT",
    payload: { unfrozenBy: govId },
  });

  return BaseService.updated(wallet);
};

/*
GET ALL CAMPAIGNS (government view)
*/
export const getCampaigns = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;

  const campaigns = await Campaign.find(filter)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  return BaseService.success(campaigns);
};

/*
PAUSE CAMPAIGN
*/
export const pauseCampaign = async (campaignId, reason, govId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);

  campaign.status = "PAUSED";
  campaign.pausedReason = reason;
  await campaign.save();

  await createAuditLog({
    eventType: "CAMPAIGN_PAUSED",
    entityType: "Campaign",
    entityId: campaign._id,
    actorRole: "GOVERNMENT",
    payload: { reason },
  });

  return BaseService.updated(campaign);
};

/*
CLOSE CAMPAIGN
*/
export const closeCampaign = async (campaignId, reason, govId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);

  campaign.status = "CLOSED";
  campaign.closedReason = reason;
  campaign.closedBy = govId;
  await campaign.save();

  return BaseService.updated(campaign);
};

/*
GET FRAUD ALERTS (government view)
*/
export const getFraudAlerts = async () => {
  const alerts = await FraudAlert.find({ status: { $in: ["OPEN", "UNDER_INVESTIGATION"] } })
    .sort({ createdAt: -1 });

  return BaseService.success(alerts);
};

/*
REVIEW HIGH RISK DONATION (legacy)
*/
export const reviewHighRiskDonation = async (donationId, decision, govId) => {
  if (decision === "APPROVE") return approveDonation(donationId, govId);
  return rejectDonation(donationId, govId, "Rejected by government");
};
