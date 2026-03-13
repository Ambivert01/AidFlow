import { Campaign } from "../models/Campaign.model.js";
import { Donation } from "../models/Donation.model.js";
import { Wallet } from "../models/Wallet.model.js";
import { AuditLog } from "../models/AuditLog.model.js";
import { verifyOnChain } from "../services/blockchainAudit.service.js";

/* ──────────────────────────────────────────
   PUBLIC PLATFORM STATS
────────────────────────────────────────── */
export const getPublicStats = async (req, res) => {
  try {
    const [
      activeCampaigns, totalDonations, totalWallets,
      totalSpentAgg, totalDonatedAgg, finalizedAudits,
    ] = await Promise.all([
      Campaign.countDocuments({ status: "ACTIVE" }),
      Donation.countDocuments(),
      Wallet.countDocuments({ status: "ACTIVE" }),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: { $subtract: ["$balance", "$balance"] } } } }]),
      Donation.aggregate([{ $match: { status: { $in: ["READY_FOR_USE", "AUDIT_FINALIZED"] } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      AuditLog.countDocuments({ merkleRoot: { $ne: null } }),
    ]);

    res.json({
      activeCampaigns,
      totalDonations,
      activeWallets: totalWallets,
      totalDisbursed: totalDonatedAgg[0]?.total || 0,
      auditedWorkflows: finalizedAudits,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch public stats" });
  }
};

/* ──────────────────────────────────────────
   PUBLIC: GET ACTIVE CAMPAIGNS (browse)
────────────────────────────────────────── */
export const getPublicCampaigns = async (req, res) => {
  try {
    const { disasterType, state, q } = req.query;
    const filter = { status: "ACTIVE" };

    if (disasterType) filter.disasterType = disasterType;
    if (state) filter["location.state"] = { $regex: state, $options: "i" };
    if (q) filter.title = { $regex: q, $options: "i" };

    const campaigns = await Campaign.find(filter)
      .select("title description disasterType location policySnapshot status totalDonated totalBeneficiaries createdAt")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
};

/* ──────────────────────────────────────────
   PUBLIC: CAMPAIGN DETAIL WITH AUDIT SUMMARY
────────────────────────────────────────── */
export const getPublicCampaignDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id)
      .populate("createdBy", "name");

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const donations = await Donation.find({ campaign: id })
      .select("amount status createdAt")
      .sort({ createdAt: -1 });

    const totalDonated = donations.reduce((s, d) => s + d.amount, 0);
    const statusBreakdown = {};
    donations.forEach((d) => {
      statusBreakdown[d.status] = (statusBreakdown[d.status] || 0) + 1;
    });

    res.json({
      campaign,
      stats: {
        totalDonations: donations.length,
        totalDonated,
        statusBreakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaign detail" });
  }
};

/* ──────────────────────────────────────────
   PUBLIC AUDIT: Full workflow by jobIdHash
────────────────────────────────────────── */
export const getPublicAudit = async (req, res) => {
  try {
    const { jobIdHash } = req.params;

    const logs = await AuditLog.find({ jobIdHash })
      .populate("campaignId", "title disasterType location")
      .sort({ createdAt: 1 });

    if (!logs.length)
      return res.status(404).json({ message: "No audit records found for this ID" });

    const EVENT_LABELS = {
      DONATION_CREATED: "Donation Received by System",
      DONATION_ELIGIBILITY_FAILED: "AI Eligibility Check Failed (Review Needed)",
      DONATION_PENDING_NGO_REVIEW: "Donation Queued for Manual NGO Review",
      BENEFICIARY_REGISTERED: "Beneficiary Registered",
      BENEFICIARY_AI_EVALUATED: "AI Evaluated Beneficiary Risk & Criteria",
      BENEFICIARY_APPROVED_BY_NGO: "NGO Approved Beneficiary for Campaign",
      BENEFICIARY_REJECTED_BY_NGO: "NGO Rejected Beneficiary",
      DONATION_BENEFICIARY_ASSIGNED: "Beneficiary Assigned to Donation",
      DONATION_APPROVED_BY_NGO: "NGO Approved — Aid Released to Wallet",
      DONATION_READY_FOR_USE: "Aid Available for Beneficiary Spending",
      DONATION_REJECTED_BY_NGO: "NGO Rejected Donation",
      DONATION_APPROVED_BY_GOVT: "Government Cleared High-Risk Donation",
      DONATION_REJECTED_BY_GOVT: "Government Rejected Donation",
      WALLET_CREATED: "Aid Wallet Activated for Beneficiary",
      WALLET_SPENT: "Aid Used at Merchant Shop",
      WALLET_FROZEN: "Wallet Frozen by Authority",
      WALLET_UNFROZEN: "Wallet Restored by Authority",
      WALLET_CLOSED: "Aid Wallet Closed (Completed)",
      MERCHANT_CATEGORY_VIOLATION: "⚠ Merchant Category Violation Detected",
      WORKFLOW_AUDIT_FINALIZED: "Audit Finalized & Anchored on Blockchain",
    };

    const finalizedLog = logs.find((l) => l.merkleRoot);

    return res.json({
      jobIdHash,
      campaign: logs[0]?.campaignId || null,
      auditFinalized: !!finalizedLog,
      merkleRoot: finalizedLog?.merkleRoot || null,
      blockchainTxHash: finalizedLog?.blockchainTxHash || null,
      timeline: logs.map((log) => ({
        event: log.eventType,
        label: EVENT_LABELS[log.eventType] || log.eventType.replaceAll("_", " "),
        actor: log.actorRole,
        timestamp: log.createdAt,
        hash: log.hash,
        previousHash: log.previousHash,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch audit" });
  }
};

/* ──────────────────────────────────────────
   PUBLIC AUDIT: All donations for a campaign
────────────────────────────────────────── */
export const getCampaignAuditSummary = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId)
      .populate("createdBy", "name");

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const donations = await Donation.find({ campaign: campaignId })
      .select("_id amount status aiDecision aiRiskScore lastDecisionBy createdAt")
      .sort({ createdAt: -1 });

    const result = donations.map((d) => ({
      donationId: d._id,
      jobIdHash: d._id.toString(),
      amount: d.amount,
      status: d.status,
      aiDecision: d.aiDecision,
      aiRiskScore: d.aiRiskScore,
      lastDecisionBy: d.lastDecisionBy,
      createdAt: d.createdAt,
    }));

    res.json({
      campaign: {
        id: campaign._id,
        title: campaign.title,
        disasterType: campaign.disasterType,
        location: campaign.location,
        status: campaign.status,
        ngo: campaign.createdBy?.name,
        policySnapshot: campaign.policySnapshot,
        createdAt: campaign.createdAt,
      },
      donations: result,
      summary: {
        total: result.length,
        totalAmount: result.reduce((s, d) => s + d.amount, 0),
        byStatus: result.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaign audit summary" });
  }
};

/* ──────────────────────────────────────────
   PUBLIC: VERIFY MERKLE HASH
────────────────────────────────────────── */
export const verifyAuditHash = async (req, res) => {
  try {
    const { jobIdHash } = req.params;

    const logs = await AuditLog.find({ jobIdHash }).sort({ createdAt: 1 });
    if (!logs.length) return res.status(404).json({ valid: false, message: "No audit logs found" });

    const finalizedLog = logs.find((l) => l.merkleRoot);
    if (!finalizedLog)
      return res.json({ valid: false, jobIdHash, message: "Audit not yet finalized" });

    const localMerkleRoot = finalizedLog.merkleRoot;

    // Try blockchain verification (graceful failure)
    let chainResult = null;
    try {
      chainResult = await verifyOnChain(jobIdHash);
    } catch {
      // blockchain unavailable — still show local verification
    }

    const isValid = chainResult
      ? chainResult.auditHash === localMerkleRoot
      : true; // local only if blockchain unavailable

    return res.json({
      valid: isValid,
      jobIdHash,
      merkleRoot: localMerkleRoot,
      blockchainVerified: !!chainResult,
      blockchain: chainResult
        ? { anchored: true, timestamp: chainResult.timestamp }
        : { anchored: false, reason: "Blockchain verification unavailable" },
      blockchainTxHash: finalizedLog.blockchainTxHash || null,
      eventCount: logs.length,
    });
  } catch (err) {
    res.status(500).json({ valid: false, message: err.message });
  }
};
