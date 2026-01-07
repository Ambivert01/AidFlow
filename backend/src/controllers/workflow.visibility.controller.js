import { Donation } from "../models/Donation.model.js";
import { AuditLog } from "../models/AuditLog.model.js";
import { Campaign } from "../models/Campaign.model.js";

export const getWorkflowVisibility = async (req, res) => {
  const { campaignId } = req.params;

  const campaign = await Campaign.findById(campaignId);

  if (!campaign)
    return res.status(404).json({ message: "Campaign not found" });

  if (campaign.createdBy.toString() !== req.user.id)
    return res.status(403).json({ message: "Unauthorized" });

  const donations = await Donation.find({ campaign: campaignId });

  const response = [];

  for (const d of donations) {
    const logs = await AuditLog.find({ jobIdHash: d._id.toString() });

    response.push({
      donationId: d._id,
      stages: [
        d.eligibilityResult && {
          stage: "ELIGIBILITY",
          status: d.eligibilityResult.eligible ? "PASSED" : "FAILED",
          confidence: d.eligibilityResult.confidence
        },
        d.fraudResult && {
          stage: "FRAUD",
          status: d.fraudResult.fraudRisk,
          riskScore: d.fraudResult.riskScore
        },
        { stage: "NGO_REVIEW", status: d.status },
        { stage: "WALLET", status: d.walletId ? "CREATED" : "PENDING" }
      ].filter(Boolean),
      audit: {
        finalized: logs.some(l => l.merkleRoot),
        merkleRoot: logs.find(l => l.merkleRoot)?.merkleRoot || null,
        anchored: logs.some(l => l.blockchainTxHash)
      }
    });
  }

  res.json({
    campaignId,
    status: campaign.status,
    pipeline: response
  });
};
