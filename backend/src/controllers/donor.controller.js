import { Donation } from "../models/Donation.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditLog } from "../models/AuditLog.model.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();

/* ──────────────────────────────────────────
   DONOR DASHBOARD STATS
────────────────────────────────────────── */
export const getDonorDashboard = async (req, res) => {
  try {
    const donorId = req.user.id;

    const donations = await Donation.find({ donor: donorId });
    const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
    const activeDonations = donations.filter((d) => d.status === "READY_FOR_USE").length;
    const pendingDonations = donations.filter((d) => d.status === "PENDING_NGO_REVIEW").length;
    const campaignIds = [...new Set(donations.map((d) => d.campaign.toString()))];

    res.json({
      totalDonated,
      totalDonations: donations.length,
      activeDonations,
      pendingDonations,
      campaignsSupported: campaignIds.length,
    });
  } catch (err) {
    console.error("DONOR DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

/* ──────────────────────────────────────────
   GET MY DONATIONS (with audit status)
────────────────────────────────────────── */
export const getMyDonations = async (req, res) => {
  try {
    const donorId = req.user.id;

    const donations = await Donation.find({ donor: donorId })
      .populate("campaign", "title location disasterType status")
      .populate("beneficiary", "name status")
      .sort({ createdAt: -1 });

    const result = [];

    for (const d of donations) {
      const finalizedLog = await AuditLog.findOne({
        jobIdHash: d._id.toString(),
        merkleRoot: { $ne: null },
      });

      result.push({
        donationId: d._id,
        campaign: d.campaign,
        beneficiary: d.beneficiary,
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        aiDecision: d.aiDecision,
        aiRiskScore: d.aiRiskScore,
        lastDecisionBy: d.lastDecisionBy,
        decisionReason: d.decisionReason,
        auditHash: finalizedLog?.merkleRoot || null,
        blockchainTxHash: finalizedLog?.blockchainTxHash || null,
        auditFinalized: !!finalizedLog,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET MY DONATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load donations" });
  }
};

/* ──────────────────────────────────────────
   GET SINGLE DONATION DETAIL + AUDIT TRAIL
────────────────────────────────────────── */
export const getDonationDetail = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId)
      .populate("campaign", "title location disasterType policySnapshot status")
      .populate("beneficiary", "name status location aiDecision");

    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.donor.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    const auditLogs = await AuditLog.find({
      jobIdHash: donation._id.toString(),
    }).sort({ createdAt: 1 });

    const EVENT_LABELS = {
      DONATION_CREATED: "Donation Received by System",
      BENEFICIARY_AI_EVALUATED: "AI Evaluated Beneficiary",
      DONATION_BENEFICIARY_ASSIGNED: "NGO Assigned Beneficiary",
      DONATION_APPROVED_BY_NGO: "NGO Approved — Wallet Created",
      DONATION_REJECTED_BY_NGO: "NGO Rejected Donation",
      WALLET_CREATED: "Aid Wallet Activated",
      WALLET_SPENT: "Aid Used by Beneficiary",
      DONATION_APPROVED_BY_GOVT: "Government Cleared Donation",
      DONATION_REJECTED_BY_GOVT: "Government Rejected Donation",
      WORKFLOW_AUDIT_FINALIZED: "Audit Finalized & Anchored",
    };

    const finalizedLog = auditLogs.find((a) => a.merkleRoot);

    res.json({
      donation,
      audit: {
        finalized: !!finalizedLog,
        merkleRoot: finalizedLog?.merkleRoot || null,
        blockchainTxHash: finalizedLog?.blockchainTxHash || null,
        timeline: auditLogs.map((a) => ({
          event: a.eventType,
          label: EVENT_LABELS[a.eventType] || a.eventType.replaceAll("_", " "),
          actor: a.actorRole,
          timestamp: a.createdAt,
          payload: a.payload,
        })),
      },
    });
  } catch (err) {
    console.error("DONATION DETAIL ERROR:", err);
    res.status(500).json({ message: "Failed to load donation detail" });
  }
};

/* ──────────────────────────────────────────
   SEARCH / BROWSE ACTIVE CAMPAIGNS
────────────────────────────────────────── */
export const searchCampaigns = async (req, res) => {
  try {
    const { disasterType, state, district, q } = req.query;
    const filter = { status: "ACTIVE" };

    if (disasterType) filter.disasterType = disasterType;
    if (state) filter["location.state"] = { $regex: state, $options: "i" };
    if (district) filter["location.district"] = { $regex: district, $options: "i" };
    if (q) filter.title = { $regex: q, $options: "i" };

    const campaigns = await Campaign.find(filter)
      .select("title description disasterType location policySnapshot status totalDonated totalBeneficiaries createdAt")
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};
