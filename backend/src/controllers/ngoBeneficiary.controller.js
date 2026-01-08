import { Beneficiary } from "../models/Beneficiary.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditService } from "../services/audit.service.js";
import { createWorkflowEngine } from "../services/workflow.service.js";

const audit = new AuditService();

/**
 * NGO: Register existing user as beneficiary
 */
export const registerBeneficiary = async (req, res) => {
  const { userId, campaignId } = req.body;

  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.status !== "ACTIVE") {
    return res.status(400).json({ message: "Invalid campaign" });
  }

  const exists = await Beneficiary.findOne({ user: userId, campaign: campaignId });
  if (exists) {
    return res.status(409).json({ message: "Beneficiary already registered" });
  }

  const beneficiary = await Beneficiary.create({
    user: userId,
    campaign: campaignId,
    registeredBy: req.user.id,
    status: "REGISTERED",
  });

  await audit.log({
    eventType: "BENEFICIARY_REGISTERED",
    payload: { beneficiaryId: beneficiary._id },
    jobIdHash: beneficiary._id.toString(),
    campaignId,
    actorRole: "NGO",
  });

  // AI evaluation via workflow engine
  const workflow = createWorkflowEngine();
  await workflow.evaluateBeneficiary({
    beneficiary,
    campaign,
    jobIdHash: beneficiary._id.toString(),
  });

  res.status(201).json(beneficiary);
};

/**
 * NGO override AI decision
 */
export const ngoOverrideDecision = async (req, res) => {
  const { decision, reason } = req.body;
  const beneficiary = await Beneficiary.findById(req.params.id);

  if (!beneficiary) {
    return res.status(404).json({ message: "Beneficiary not found" });
  }

  beneficiary.overrideByNgo = {
    decision,
    reason,
    overriddenAt: new Date(),
  };

  beneficiary.status = decision === "APPROVE" ? "ACTIVE" : "BLOCKED";
  await beneficiary.save();

  await audit.log({
    eventType: "BENEFICIARY_NGO_OVERRIDE",
    payload: { decision, reason },
    jobIdHash: beneficiary._id.toString(),
    campaignId: beneficiary.campaign,
    actorRole: "NGO",
  });

  res.json({ message: "Decision recorded" });
};
