import { Worker } from "bullmq";
import { connection } from "../queues/connection.js";

import { Donation } from "../models/Donation.model.js";
import { runDonationAI } from "../infrastructure/ai/ai.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";

new Worker(
  "donationQueue",

  async (job) => {

    const { donationId } = job.data;

    const donation = await Donation.findById(donationId);

    if (!donation) return;

    console.log("Processing donation:", donationId);

    // AI Risk Analysis
    const aiResult = await runDonationAI(donation);

    donation.aiDecision = {
      decision: aiResult.decision,
      riskScore: aiResult.riskScore,
      fraudSignals: aiResult.flags,
    };

    // Routing decision
    if (aiResult.riskScore > 80) {

      donation.status = "HIGH_RISK_ESCALATED";

    } else {

      donation.status = "PENDING_NGO_REVIEW";

    }

    await donation.save();

    // Audit log
    await createAuditLog({

      eventType: "DONATION_CREATED",

      entityId: donation._id,

      actorRole: "AI",

      payload: {
        riskScore: aiResult.riskScore,
      },

    });

  },

  {
    connection,
  }

);