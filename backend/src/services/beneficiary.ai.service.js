import { aiClients } from "./aiDecision.js";
import { AuditService } from "./audit.service.js";

const auditService = new AuditService();

export async function evaluateBeneficiaryAI(beneficiary) {
  const eligibility = await aiClients.eligibility.check({
    beneficiary: beneficiary.user,
    disaster: { affectedWards: [beneficiary.location] },
  });

  const fraud = await aiClients.fraud.detect({
    beneficiaryId: beneficiary.user,
    recentTransactions: 0,
    totalAidReceived: 0,
    timeWindowHours: 24,
  });

  const risk = await aiClients.risk.assess({
    eligibility,
    fraud,
    policy: {
      maxAllowedRisk: 0.7,
      minEligibilityConfidence: 0.6,
    },
  });

  beneficiary.aiDecision = {
    eligibility,
    fraud,
    risk,
    evaluatedAt: new Date(),
  };

  beneficiary.status =
    risk.decision === "ALLOW"
      ? "ELIGIBLE"
      : risk.decision === "BLOCK"
      ? "BLOCKED"
      : "REGISTERED";

  await beneficiary.save();

  await auditService.log({
    eventType: "BENEFICIARY_AI_EVALUATED",
    payload: beneficiary.aiDecision,
    jobIdHash: beneficiary._id.toString(),
    campaignId: beneficiary.campaign,
    actorRole: "SYSTEM",
  });

  return beneficiary;
}
