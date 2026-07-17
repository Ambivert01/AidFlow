import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import aiService from "../infrastructure/ai/ai.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import { logger } from "../utils/logger.js";

new Worker(
  "ai-processing",
  async (job) => {
    const { type, payload } = job.data;
    logger.info({ type: "AI_JOB_START", jobType: type, jobId: job.id });

    let result;

    switch (type) {
      case "beneficiary-eligibility": {
        const { processAIEvaluationResult } =
          await import("../modules/beneficiary/beneficiary.service.js");
        const { Campaign } = await import("../models/ngo/Campaign.model.js");

        const campaign = await Campaign.findById(payload.campaignId).lean();

        const eligibilityResult =
          await aiService.evaluateBeneficiaryEligibility({
            ...payload,
            // Pass campaign context so the eligibility agent can match
            // the beneficiary's ward against the campaign's affected wards
            disasterType: campaign?.disasterType || "OTHER",
            affectedWards: campaign?.location?.ward
              ? [campaign.location.ward]
              : [],
            severity: campaign?.policySnapshot?.severity || 2.0,
            familySize: payload.household?.familySize || 1,
            vulnerabilityScore: payload.vulnerabilityScore || 70,
          });

        const fraudResult = await aiService.evaluateFraudProbability({
          beneficiaryId: payload.beneficiaryId,
          walletId: "PRE_APPROVAL",
          deviceFingerprint: payload.deviceFingerprint || "UNKNOWN",
          location: payload.location?.ward || "",
          recentTransactions: 0,
          totalAidReceived: 0,
          merchantId: "",
          timeWindowHours: 24,
        });

        const riskResult = await aiService.evaluateRisk(
          eligibilityResult,
          fraudResult,
          campaign?.policySnapshot,
        );

        result = {
          eligibilityConfidence: eligibilityResult.confidence ?? 0.75,
          fraudRisk: fraudResult.riskScore ?? 0.1,
          decision: riskResult.decision || "MANUAL_REVIEW",
          flags: [
            ...(eligibilityResult.signals
              ? Object.keys(eligibilityResult.signals).filter(
                  (k) => !eligibilityResult.signals[k],
                )
              : []),
            ...(fraudResult.flags || []),
          ],
          reason:
            riskResult.reason ||
            eligibilityResult.reason ||
            "AI evaluation completed",
        };

        if (payload.beneficiaryId) {
          await processAIEvaluationResult(payload.beneficiaryId, result);
        }
        break;
      }

      case "fraud-score": {
        result = await aiService.evaluateFraudProbability(payload);
        break;
      }

      case "campaign-risk": {
        const { Campaign } = await import("../models/ngo/Campaign.model.js");
        const { AIDecisionLog } =
          await import("../models/system/AIDecisionLog.model.js");
        const { User } = await import("../models/auth/User.model.js");

        result = await aiService.evaluateCampaignRisk(payload);

        const campaign = await Campaign.findById(payload.campaignId);
        if (campaign) {
          // Update campaign with AI risk score
          campaign.aiRiskScore = result.riskScore || 15;
          campaign.aiFlags = result.flags || [];
          await campaign.save();

          // Create AI decision log
          const ngo = await User.findById(campaign.createdBy);
          await AIDecisionLog.create({
            modelName: "campaign-risk-evaluator",
            modelVersion: "1.0",
            entityType: "Donation",
            entityId: campaign._id.toString(),
            decisionType: "DONATION_RISK",
            decision: result.decision || "ALLOW",
            confidenceScore: result.confidence || 0.85,
            riskScore: result.riskScore || 15,
            flags: result.flags || [],
            reason: result.reason || "Campaign risk evaluation completed",
            metadata: {
              campaignTitle: campaign.title,
              ngoName: ngo?.name || "Unknown",
              targetAmount: campaign.targetAmount,
              disasterType: campaign.disasterType,
            },
          });
        }
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
      entityId: String(
        payload.beneficiaryId ||
          payload.campaignId ||
          payload.entityId ||
          job.id,
      ),
      jobIdHash: job.id.toString(),
      actorId: null,
      actorRole: "AI",
      payload: { model: type, result },
    });

    return result;
  },
  { connection: redisConnection, concurrency: 5 },
);

function mapCategory(type) {
  const map = {
    "beneficiary-eligibility": "BENEFICIARY",
    "fraud-score": "SECURITY",
    "campaign-risk": "CAMPAIGN",
    "proof-validation": "PROOF",
    "anomaly-detection": "TRANSACTION",
  };
  return map[type] || "SYSTEM";
}

function mapEntity(type) {
  const map = {
    "beneficiary-eligibility": "Beneficiary",
    "fraud-score": "User",
    "campaign-risk": "Campaign",
    "proof-validation": "Proof",
    "anomaly-detection": "Wallet",
  };
  return map[type] || "User";
}
