import { Beneficiary } from "../models/Beneficiary.model.js";
import { evaluateBeneficiaryAI } from "../services/beneficiary.ai.service.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();

export const registerBeneficiary = async (req, res) => {
  const { userId, campaignId } = req.body;

  const exists = await Beneficiary.findOne({ user: userId });
  if (exists) {
    return res.status(409).json({ message: "Already registered" });
  }

  const beneficiary = await Beneficiary.create({
    user: userId,
    campaign: campaignId,
    registeredBy: req.user.id,
    status: "REGISTERED",
  });

  await auditService.log({
    eventType: "BENEFICIARY_REGISTERED",
    payload: { beneficiaryId: beneficiary._id },
    jobIdHash: beneficiary._id.toString(),
    campaignId,
    actorRole: "NGO",
  });

  // 🔑 AI evaluation (async but deterministic)
  await evaluateBeneficiaryAI(beneficiary);

  res.status(201).json(beneficiary);
};

export const ngoOverrideDecision = async (req, res) => {
  const { decision, reason } = req.body;
  const beneficiary = await Beneficiary.findById(req.params.id);

  if (!beneficiary || beneficiary.status !== "ELIGIBLE") {
    return res.status(400).json({ message: "Invalid state" });
  }

  beneficiary.overrideByNgo = {
    decision,
    reason,
    overriddenAt: new Date(),
  };

  beneficiary.status = decision === "APPROVE" ? "APPROVED" : "REJECTED";
  await beneficiary.save();

  await auditService.log({
    eventType: "BENEFICIARY_NGO_OVERRIDE",
    payload: { decision, reason },
    jobIdHash: beneficiary._id.toString(),
    campaignId: beneficiary.campaign,
    actorRole: "NGO",
  });

  res.json({ message: "Decision recorded" });
};
