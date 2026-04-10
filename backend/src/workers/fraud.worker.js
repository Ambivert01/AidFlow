import { Worker } from "bullmq";

import { redisConnection } from "../config/redis.config.js";

import aiService from "../infrastructure/ai/ai.service.js";

import { createAuditLog } from "../modules/audit/audit.service.js";

import workflowEngine from "../engines/workflow.engine.js";

new Worker(
  "fraud-detection",

  async (job) => {
    const { entityType, entityId, signals } = job.data;

    const result = await aiService.evaluateFraudProbability({
      type: entityType,

      signals,
    });

    if (result.riskScore > 85) {
      await workflowEngine.handleFraudDetected({
        entityType,

        entityId,

        riskScore: result.riskScore,
      });

      await createAuditLog({
        eventType: "FRAUD_DETECTED",

        eventCategory: "SECURITY",

        entityType: entityType || "User",

        entityId: String(entityId),

        jobIdHash: job.id.toString(),

        actorRole: "AI",

        payload: {
          riskScore: result.riskScore,

          signals,
        },
      });
    }

    return result;
  },

  {
    connection: redisConnection,

    concurrency: 3,
  },
);
