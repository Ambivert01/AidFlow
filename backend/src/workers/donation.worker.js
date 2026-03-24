import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

import { Donation } from "../models/Donation.model.js";
import aiService from "../infrastructure/ai/ai.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";

new Worker(
  "donation-processing",

  async (job) => {
    const { donationId } = job.data;

    const donation = await Donation.findById(donationId);

    if (!donation) return;

    const aiResult = await aiService.evaluateDonationRisk({
      amount: donation.amount,

      history: donation.history,
    });

    donation.aiDecision = {
      decision: aiResult.decision,

      riskScore: aiResult.riskScore,

      evaluatedAt:new Date()
    };

    donation.status =
      aiResult.riskScore > 80 ? "HIGH_RISK_ESCALATED" : "PENDING_NGO_REVIEW";

    await donation.save();

    await createAuditLog({
      eventType: "DONATION_AI_PROCESSED",

      entityId: donation._id,

      actorRole: "AI",
    });
  },

  {
    connection: redisConnection,
  },
);
