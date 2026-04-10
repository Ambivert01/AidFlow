import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import aiService from "../infrastructure/ai/ai.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import { Beneficiary } from "../models/beneficiary/Beneficiary.model.js";
import { Donation } from "../models/donor/Donation.model.js";
import { logger } from "../utils/logger.js";

new Worker(
  "ai-processing",
  async (job) => {
    const { type, payload } = job.data;
    logger.info({ type: "AI_JOB_START", jobType: type, jobId: job.id });

    let result;

    switch (type) {
      case "donation-risk": {
        result = await aiService.evaluateDonationRisk(payload);

        const donation = await Donation.findById(payload.donationId);
        if (donation) {
          const riskScore = Math.round((result.riskScore || 0.1) * 100);
          donation.aiDecision = {
            decision: riskScore > 80 ? "BLOCK" : riskScore > 40 ? "MANUAL_REVIEW" : "ALLOW",
            riskScore,
            fraudSignals: result.flags || [],
            evaluatedAt: new Date(),
          };
          donation.status = riskScore > 80 ? "HIGH_RISK_ESCALATED" : "PENDING_NGO_REVIEW";
          await donation.save();
        }
        break;
      }

      case "beneficiary-eligibility": {
        result = await aiService.evaluateBeneficiaryEligibility(payload);

        const beneficiary = await Beneficiary.findById(payload.entityId);
        if (beneficiary) {
          beneficiary.aiDecision = {
            eligibilityConfidence: result.confidence ?? 0.75,
            fraudRisk: 0.1,
            decision: result.eligible ? "ALLOW" : "BLOCK",
            flags: result.signals ? Object.keys(result.signals).filter(k => !result.signals[k]) : [],
            reason: result.reason || "",
            evaluatedAt: new Date(),
          };
          beneficiary.status = result.eligible ? "ELIGIBLE" : "BLOCKED";
          await beneficiary.save();
        }
        break;
      }

      case "fraud-score": {
        result = await aiService.evaluateFraudProbability(payload);
        break;
      }

      case "proof-validation": {
        result = await aiService.validateProof(payload);
        break;
      }

      case "anomaly-detection": {
        result = await aiService.detectAnomaly(payload);
        break;
      }

      default:
        throw new Error(`UNKNOWN_AI_JOB_TYPE: ${type}`);
    }

    await createAuditLog({
      eventType: "AI_DECISION_COMPLETED",
      eventCategory: mapCategory(type),
      entityType: mapEntity(type),
      entityId: String(payload.entityId || payload.donationId || job.id),
      jobIdHash: job.id.toString(),
      actorRole: "AI",
      payload: { model: type, result },
    });

    return result;
  },
  { connection: redisConnection, concurrency: 5 }
);

function mapCategory(type) {
  const map = {
    "donation-risk": "DONATION",
    "beneficiary-eligibility": "BENEFICIARY",
    "fraud-score": "SECURITY",
    "proof-validation": "PROOF",
    "anomaly-detection": "TRANSACTION",
  };
  return map[type] || "SYSTEM";
}

function mapEntity(type) {
  const map = {
    "donation-risk": "Donation",
    "beneficiary-eligibility": "Beneficiary",
    "fraud-score": "User",
    "proof-validation": "Proof",
    "anomaly-detection": "Wallet",
  };
  return map[type] || "User";
}
