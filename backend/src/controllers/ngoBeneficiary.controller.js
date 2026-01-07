export const registerBeneficiary = async (req, res) => {
  const { name, aadhaar, location, campaignId } = req.body;

  // 1. Hash Aadhaar (never store raw)
  const aadhaarHash = crypto
    .createHash("sha256")
    .update(aadhaar)
    .digest("hex");

  // 2. Prevent duplicates (CRITICAL)
  const exists = await Beneficiary.findOne({ aadhaarHash });
  if (exists) {
    return res.status(409).json({
      message: "Beneficiary already registered in system",
    });
  }

  // 3. Create beneficiary
  const beneficiary = await Beneficiary.create({
    name,
    aadhaarHash,
    location,
    campaign: campaignId,
    status: "REGISTERED",
  });

  // 4. Audit log
  await auditService.log({
    eventType: "BENEFICIARY_REGISTERED",
    payload: { beneficiaryId: beneficiary._id },
    jobIdHash: beneficiary._id.toString(),
    campaignId,
    actorRole: "NGO",
  });

  // 5. Trigger AI evaluation (async safe)
  evaluateBeneficiaryAIAsync(beneficiary);

  res.status(201).json(beneficiary);
};

async function evaluateBeneficiaryAIAsync(beneficiary) {
  const aiResult = await aiClients.risk.assess({
    beneficiaryId: beneficiary._id,
    location: beneficiary.location,
  });

  beneficiary.aiDecision = {
    eligibilityConfidence: aiResult.eligibility.confidence,
    fraudRisk: aiResult.fraud.riskScore,
    decision: aiResult.risk.decision,
    flags: aiResult.fraud.flags,
    evaluatedAt: new Date(),
  };

  if (aiResult.risk.decision === "ALLOW") {
    beneficiary.status = "AI_APPROVED";
  } else {
    beneficiary.status = "AI_FLAGGED";
  }

  await beneficiary.save();

  await auditService.log({
    eventType: "BENEFICIARY_AI_EVALUATED",
    payload: aiResult,
    jobIdHash: beneficiary._id.toString(),
    campaignId: beneficiary.campaign,
    actorRole: "SYSTEM",
  });
}

export const ngoDecision = async (req, res) => {
  const { decision, reason } = req.body;
  const beneficiary = await Beneficiary.findById(req.params.id);

  if (beneficiary.status !== "AI_FLAGGED") {
    return res.status(400).json({ message: "Invalid state" });
  }

  beneficiary.ngoDecision = {
    approvedBy: req.user.id,
    decision,
    reason,
    decidedAt: new Date(),
  };

  beneficiary.status =
    decision === "APPROVE" ? "NGO_APPROVED" : "NGO_REJECTED";

  await beneficiary.save();

  await auditService.log({
    eventType: "BENEFICIARY_NGO_DECISION",
    payload: { decision, reason },
    jobIdHash: beneficiary._id.toString(),
    campaignId: beneficiary.campaign,
    actorRole: "NGO",
  });

  res.json({ message: "Decision recorded" });
};
