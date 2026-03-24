import { Worker } from "bullmq";

import { redisConnection } from "../config/redis.config.js";

import aiService from "../infrastructure/ai/ai.service.js";

import { createAuditLog } from "../modules/audit/audit.service.js";

new Worker(
  "ai-processing",

  async (job) => {
    const { type, payload } = job.data;

    let result;

    switch (type) {
      case "donation-risk":
        result = await aiService.evaluateDonationRisk(payload);

        break;

      case "beneficiary-eligibility":
        result = await aiService.evaluateBeneficiaryEligibility(payload);

        break;

      case "fraud-score":
        result = await aiService.evaluateFraudProbability(payload);

        break;

      case "proof-validation":
        result = await aiService.validateProof(payload);

        break;

      case "anomaly-detection":
        result = await aiService.detectAnomaly(payload);

        break;

      default:
        throw new Error("UNKNOWN_AI_JOB_TYPE");
    }

    await createAuditLog({
      eventType: "AI_DECISION_COMPLETED",

      actorRole: "AI",

      payload: {
        type,

        result,
      },
    });

    return result;
  },

  {
    connection: redisConnection,

    concurrency: 5,
  },
);
