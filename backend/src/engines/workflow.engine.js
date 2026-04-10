import { createAuditLog } from "../modules/audit/audit.service.js";
import { addFraudCheckJob } from "../jobs/fraud.job.js";
import { addAIDecisionJob } from "../jobs/ai.job.js";

class WorkflowEngine {
  async handleDonationCreated(donation) {
    await createAuditLog({
      eventType: "DONATION_CREATED",

      entityId: donation._id,

      actorRole: "SYSTEM",
    });

    await addAIDecisionJob({
      type: "donation-risk",

      payload: {
        donationId: donation._id,
        amount: donation.amount,
      },
    });
  }

  async handleTransactionCompleted(data) {
    await createAuditLog({
      eventType: "TRANSACTION_COMPLETED",

      entityId: data.id,

      actorRole: "SYSTEM",
    });

    await addFraudCheckJob({
      entityType: "wallet",

      entityId: data.id,

      signals: {
        amount: data.amount,
      },
    });
  }

  async handleFraudDetected(event) {
    await createAuditLog({
      eventType: "FRAUD_DETECTED",

      entityId: event.entityId,

      actorRole: "AI",

      payload: {
        riskScore: event.riskScore,
      },
    });
  }

  async handleBeneficiaryVerified(data) {
    const wallet = await createWallet({
      beneficiary: data.id,
      campaign: data.campaignId,
      amount: data.amount,
      policy: data.policy,
    });

    await createAuditLog({
      eventType: "WALLET_CREATED",

      entityId: wallet._id,

      actorRole: "SYSTEM",
    });

    return wallet;
  }
}

export default new WorkflowEngine();
