import { Donation } from "../models/Donation.model.js";
import { AuditService } from "../services/audit.service.js";
import { createWorkflowEngine } from "../services/workflow.service.js";

/**
 * Get all donations pending NGO review
 */
export const getPendingDonations = async (req, res) => {
  const donations = await Donation.find({
    status: "PENDING_NGO_REVIEW",
  }).populate("donor campaign");

  res.json(donations);
};

/**
 * NGO approves donation
 */
export const approveDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("campaign");

    if (!donation || donation.status !== "PENDING_NGO_REVIEW") {
      return res.status(400).json({ message: "Invalid donation state" });
    }

    // 1 ALWAYS log NGO decision FIRST
    const auditService = new AuditService();

    await auditService.log({
      eventType: "DONATION_APPROVED_BY_NGO",
      payload: { donationId: donation._id },
      jobIdHash: donation._id.toString(),
      campaignId: donation.campaign._id,
      actorRole: "NGO",
    });

    // 2 Resume workflow (wallet + ready)
    const workflow = createWorkflowEngine();

    await workflow.resumeAfterNGOApproval({
      donation,
      campaign: donation.campaign,
    });

    // 3 Mark donation
    donation.status = "READY_FOR_USE";
    donation.lastDecisionBy = "SYSTEM";
    donation.decisionReason = null;
    await donation.save();

    // 4 FINALIZE AUDIT (THIS WAS MISSING RELIABILITY)
    await auditService.finalizeWorkflowAudit({
      jobIdHash: donation._id.toString(),
      campaignId: donation.campaign._id,
    });

    res.json({ message: "Donation approved and audit finalized" });

  } catch (err) {
    console.error("NGO APPROVE ERROR:", err);
    res.status(500).json({
      message: "Approval failed, donation returned to review queue",
    });
  }
};


/**
 * NGO rejects donation
 */
export const rejectDonation = async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation || donation.status !== "PENDING_NGO_REVIEW") {
    return res.status(400).json({ message: "Invalid donation state" });
  }

  donation.status = "REJECTED_BY_NGO";
  donation.lastDecisionBy = "NGO";
  donation.decisionReason = req.body.reason || "Rejected by NGO";
  await donation.save();

  const auditService = new AuditService();
  await auditService.log({
    eventType: "DONATION_REJECTED_BY_NGO",
    payload: {
      donationId: donation._id,
      reason: donation.decisionReason,
    },
    jobIdHash: donation._id.toString(),
    campaignId: donation.campaign,
    actorRole: "NGO",
  });

  res.json({ message: "Donation rejected by NGO" });
};
