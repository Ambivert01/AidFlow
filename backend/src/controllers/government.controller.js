import { Donation } from "../models/Donation.model.js";
import { Wallet } from "../models/Wallet.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditService } from "../services/audit.service.js";
import { createWorkflowEngine } from "../services/workflow.service.js";

/**
 * GOVT DASHBOARD OVERVIEW
 */
export const getOverview = async (req, res) => {
  const stats = {
    escalated: await Donation.countDocuments({ status: "HIGH_RISK_ESCALATED" }),
    approved: await Donation.countDocuments({ status: "APPROVED_BY_GOVT" }),
    rejected: await Donation.countDocuments({ status: "REJECTED_BY_GOVT" }),
    frozenWallets: await Wallet.countDocuments({ status: "FROZEN" }),
  };

  res.json(stats);
};

/**
 * GET ESCALATED DONATIONS
 */
export const getEscalatedDonations = async (req, res) => {
  const list = await Donation.find({
    status: "HIGH_RISK_ESCALATED",
  }).populate("campaign donor beneficiary");

  res.json(list);
};

/**
 * GOVT APPROVES DONATION
 */
export const approveDonation = async (req, res) => {
  const donation = await Donation.findById(req.params.id).populate("campaign");

  if (!donation || donation.status !== "HIGH_RISK_ESCALATED") {
    return res.status(400).json({ message: "Invalid donation state" });
  }

  donation.status = "APPROVED_BY_GOVT";
  donation.lastDecisionBy = "GOVERNMENT";
  await donation.save();

  const audit = new AuditService();
  await audit.log({
    eventType: "DONATION_APPROVED_BY_GOVT",
    payload: { donationId: donation._id },
    jobIdHash: donation._id.toString(),
    campaignId: donation.campaign._id,
    actorRole: "GOVERNMENT",
  });

  // Resume workflow → creates wallet
  const workflow = createWorkflowEngine();
  await workflow.resumeAfterNGOApproval({
    donation,
    campaign: donation.campaign,
  });

  res.json({ message: "Donation approved by government" });
};

/**
 * GOVT REJECTS DONATION
 */
export const rejectDonation = async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation || donation.status !== "HIGH_RISK_ESCALATED") {
    return res.status(400).json({ message: "Invalid donation state" });
  }

  donation.status = "REJECTED_BY_GOVT";
  donation.lastDecisionBy = "GOVERNMENT";
  donation.decisionReason = req.body.reason || "Rejected by government";
  await donation.save();

  const audit = new AuditService();
  await audit.log({
    eventType: "DONATION_REJECTED_BY_GOVT",
    payload: {
      donationId: donation._id,
      reason: donation.decisionReason,
    },
    jobIdHash: donation._id.toString(),
    campaignId: donation.campaign,
    actorRole: "GOVERNMENT",
  });

  res.json({ message: "Donation rejected by government" });
};

/**
 * FREEZE WALLET
 */
export const freezeWallet = async (req, res) => {
  const wallet = await Wallet.findById(req.params.id);

  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  wallet.status = "FROZEN";
  await wallet.save();

  const audit = new AuditService();
  await audit.log({
    eventType: "WALLET_FROZEN",
    payload: { walletId: wallet._id },
    jobIdHash: wallet.jobIdHash,
    campaignId: wallet.campaign,
    actorRole: "GOVERNMENT",
  });

  res.json({ message: "Wallet frozen" });
};

/**
 * UNFREEZE WALLET
 */
export const unfreezeWallet = async (req, res) => {
  const wallet = await Wallet.findById(req.params.id);

  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  wallet.status = "ACTIVE";
  await wallet.save();

  res.json({ message: "Wallet unfrozen" });
};

/**
 * GET CAMPAIGNS FOR GOVT
 */
export const getActiveCampaignsForGovt = async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  res.json(campaigns);
};

/**
 * PAUSE CAMPAIGN
 */
export const pauseCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });

  campaign.status = "PAUSED";
  await campaign.save();

  res.json({ message: "Campaign paused" });
};

/**
 * CLOSE CAMPAIGN
 */
export const closeCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });

  campaign.status = "CLOSED";
  await campaign.save();

  res.json({ message: "Campaign closed" });
};
