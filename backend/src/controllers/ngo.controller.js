import { Donation } from "../models/Donation.model.js";
import { AuditService } from "../services/audit.service.js";
import { createWorkflowEngine } from "../services/workflow.service.js";

const auditService = new AuditService();
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
  const donation = await Donation.findById(req.params.id).populate("campaign");

  if (!donation || donation.status !== "PENDING_NGO_REVIEW") {
    return res.status(400).json({ message: "Invalid donation state" });
  }

  // 1 NGO decision
  donation.status = "APPROVED_BY_NGO";
  donation.lastDecisionBy = "NGO";
  await donation.save();

  await auditService.log({
    eventType: "DONATION_APPROVED_BY_NGO",
    payload: { donationId: donation._id },
    jobIdHash: donation._id.toString(),
    campaignId: donation.campaign._id,
    actorRole: "NGO",
  });

  // 2 SYSTEM resumes workflow
  const workflow = createWorkflowEngine();
  await workflow.resumeAfterNGOApproval({
    donation,
    campaign: donation.campaign,
  });

  // 3 FINALIZE AUDIT (IMPORTANT)
  await auditService.finalizeWorkflowAudit({
    jobIdHash: donation._id.toString(),
    campaignId: donation.campaign._id,
  });

  res.json({
    message: "Donation approved, wallet created, audit finalized",
  });
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
  donation.decisionReason = req.body.reason;
  await donation.save();

  await auditService.log({
    eventType: "DONATION_REJECTED_BY_NGO",
    payload: { reason: req.body.reason },
    jobIdHash: donation._id.toString(),
    campaignId: donation.campaign,
    actorRole: "NGO",
  });

  res.json({ message: "Donation rejected permanently" });
};

