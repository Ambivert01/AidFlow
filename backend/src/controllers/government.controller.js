import { Donation } from "../models/Donation.model.js";
import { Wallet } from "../models/Wallet.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditLog } from "../models/AuditLog.model.js";
import { AuditService } from "../services/audit.service.js";
import { createWallet } from "../services/wallet.service.js";

const auditService = new AuditService();

/* ──────────────────────────────────────────
   GOVERNMENT SYSTEM OVERVIEW
────────────────────────────────────────── */
export const getOverview = async (req, res) => {
  try {
    const [
      escalatedDonations,
      activeWallets,
      activeCampaigns,
      totalDonations,
    ] = await Promise.all([
      Donation.countDocuments({ status: "HIGH_RISK_ESCALATED" }),
      Wallet.countDocuments({ status: "ACTIVE" }),
      Campaign.countDocuments({ status: "ACTIVE" }),
      Donation.countDocuments(),
    ]);

    const [
      frozenAmountAgg,
      totalDisbursedAgg,
    ] = await Promise.all([
      Wallet.aggregate([
        { $match: { status: "FROZEN" } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),
      Donation.aggregate([
        { $match: { status: { $in: ["READY_FOR_USE", "AUDIT_FINALIZED"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      escalatedDonations,
      frozenAmount: frozenAmountAgg[0]?.total || 0,
      activeWallets,
      totalDisbursed: totalDisbursedAgg[0]?.total || 0,
      activeCampaigns,
      totalDonations,
    });
  } catch (err) {
    console.error("GOVT OVERVIEW ERROR:", err);
    res.status(500).json({ message: "Failed to fetch overview" });
  }
};

/* ──────────────────────────────────────────
   GET ESCALATED DONATIONS
────────────────────────────────────────── */
export const getEscalatedDonations = async (req, res) => {
  try {
    const list = await Donation.find({ status: "HIGH_RISK_ESCALATED" })
      .populate("campaign", "title disasterType location")
      .populate("donor", "name email")
      .populate("beneficiary", "name status aiDecision")
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch escalated donations" });
  }
};

/* ──────────────────────────────────────────
   GOVERNMENT APPROVES ESCALATED DONATION
────────────────────────────────────────── */
export const approveDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate("campaign");

    if (!donation || donation.status !== "HIGH_RISK_ESCALATED")
      return res.status(400).json({ message: "Invalid donation state" });
    if (!donation.beneficiary)
      return res.status(400).json({ message: "No beneficiary assigned" });

    const jobIdHash = donation._id.toString();

    donation.status = "WALLET_CREATING";
    donation.lastDecisionBy = "GOVERNMENT";
    await donation.save();

    await auditService.log({
      eventType: "DONATION_APPROVED_BY_GOVT",
      entityId: donation._id.toString(),
      payload: { donationId: donation._id },
      jobIdHash,
      campaignId: donation.campaign._id,
      actorRole: "GOVERNMENT",
    });

    // Create wallet
    const wallet = await createWallet({
      beneficiaryId: donation.beneficiary,
      campaign: donation.campaign,
      amount: donation.amount,
      jobIdHash,
    });

    donation.status = "READY_FOR_USE";
    await donation.save();

    res.json({ message: "Donation approved by government, wallet created", walletId: wallet._id });
  } catch (err) {
    console.error("GOVT APPROVE ERROR:", err);
    res.status(500).json({ message: "Approval failed: " + err.message });
  }
};

/* ──────────────────────────────────────────
   GOVERNMENT REJECTS ESCALATED DONATION
────────────────────────────────────────── */
export const rejectDonation = async (req, res) => {
  try {
    const { reason } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation || donation.status !== "HIGH_RISK_ESCALATED")
      return res.status(400).json({ message: "Invalid donation state" });

    donation.status = "REJECTED_BY_GOVT";
    donation.lastDecisionBy = "GOVERNMENT";
    donation.decisionReason = reason || "Rejected by government";
    await donation.save();

    await auditService.log({
      eventType: "DONATION_REJECTED_BY_GOVT",
      entityId: donation._id.toString(),
      payload: { donationId: donation._id, reason: donation.decisionReason },
      jobIdHash: donation._id.toString(),
      campaignId: donation.campaign,
      actorRole: "GOVERNMENT",
    });

    res.json({ message: "Donation rejected by government" });
  } catch (err) {
    res.status(500).json({ message: "Rejection failed" });
  }
};

/* ──────────────────────────────────────────
   FREEZE WALLET
────────────────────────────────────────── */
export const freezeWallet = async (req, res) => {
  try {
    const { walletId, reason } = req.body;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    wallet.status = "FROZEN";
    wallet.freezeReason = reason || "Government action";
    wallet.frozenBy = req.user.id;
    await wallet.save();

    await auditService.log({
      eventType: "WALLET_FROZEN",
      entityId: walletId,
      payload: { walletId, reason, frozenBy: req.user.id },
      jobIdHash: wallet.jobIdHash || walletId,
      campaignId: wallet.campaign,
      actorRole: "GOVERNMENT",
    });

    res.json({ message: "Wallet frozen", walletId, status: "FROZEN" });
  } catch (err) {
    res.status(500).json({ message: "Freeze failed" });
  }
};

/* ──────────────────────────────────────────
   UNFREEZE WALLET
────────────────────────────────────────── */
export const unfreezeWallet = async (req, res) => {
  try {
    const { walletId } = req.body;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    wallet.status = "ACTIVE";
    wallet.freezeReason = null;
    wallet.frozenBy = null;
    await wallet.save();

    await auditService.log({
      eventType: "WALLET_UNFROZEN",
      entityId: walletId,
      payload: { walletId, unfrozenBy: req.user.id },
      jobIdHash: wallet.jobIdHash || walletId,
      campaignId: wallet.campaign,
      actorRole: "GOVERNMENT",
    });

    res.json({ message: "Wallet unfrozen", walletId, status: "ACTIVE" });
  } catch (err) {
    res.status(500).json({ message: "Unfreeze failed" });
  }
};

/* ──────────────────────────────────────────
   GET ALL WALLETS (with filters)
────────────────────────────────────────── */
export const getWalletsList = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = status ? { status } : {};

    const wallets = await Wallet.find(filter)
      .populate("beneficiary", "name status")
      .populate("campaign", "title disasterType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Wallet.countDocuments(filter);

    res.json({ wallets, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wallets" });
  }
};

/* ──────────────────────────────────────────
   FRAUD MONITOR: Merchant violations + suspicious wallets
────────────────────────────────────────── */
export const getFraudAlerts = async (req, res) => {
  try {
    const violations = await AuditLog.find({ eventType: "MERCHANT_CATEGORY_VIOLATION" })
      .populate("campaignId", "title")
      .sort({ createdAt: -1 })
      .limit(100);

    const frozenWallets = await Wallet.find({ status: "FROZEN" })
      .populate("beneficiary", "name")
      .populate("campaign", "title")
      .sort({ updatedAt: -1 });

    // High transaction frequency wallets
    const suspiciousWallets = await Wallet.find({
      merchantTransactionCount: { $gte: 10 },
      status: "ACTIVE",
    }).populate("beneficiary", "name").limit(20);

    res.json({
      merchantViolations: violations.map((v) => ({
        id: v._id,
        payload: v.payload,
        campaign: v.campaignId,
        timestamp: v.createdAt,
      })),
      frozenWallets,
      suspiciousWallets,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fraud alerts" });
  }
};

/* ──────────────────────────────────────────
   GET ALL CAMPAIGNS (government view)
────────────────────────────────────────── */
export const getActiveCampaignsForGovt = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const campaigns = await Campaign.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

/* ──────────────────────────────────────────
   PAUSE CAMPAIGN
────────────────────────────────────────── */
export const pauseCampaign = async (req, res) => {
  try {
    const { reason } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    campaign.status = "PAUSED";
    campaign.pausedReason = reason || "Paused by government";
    await campaign.save();

    await auditService.log({
      eventType: "CAMPAIGN_PAUSED",
      entityId: campaign._id.toString(),
      payload: { campaignId: campaign._id, reason },
      jobIdHash: campaign.jobIdHash,
      campaignId: campaign._id,
      actorRole: "GOVERNMENT",
    });

    res.json({ message: "Campaign paused" });
  } catch (err) {
    res.status(500).json({ message: "Pause failed" });
  }
};

/* ──────────────────────────────────────────
   CLOSE CAMPAIGN
────────────────────────────────────────── */
export const closeCampaign = async (req, res) => {
  try {
    const { reason } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    campaign.status = "CLOSED";
    campaign.closedReason = reason || "Closed by government";
    campaign.closedBy = req.user.id;
    await campaign.save();

    await auditService.log({
      eventType: "CAMPAIGN_CLOSED",
      entityId: campaign._id.toString(),
      payload: { campaignId: campaign._id, reason },
      jobIdHash: campaign.jobIdHash,
      campaignId: campaign._id,
      actorRole: "GOVERNMENT",
    });

    res.json({ message: "Campaign closed" });
  } catch (err) {
    res.status(500).json({ message: "Close failed" });
  }
};
