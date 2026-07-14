import { createAuditLog } from "../modules/audit/audit.service.js";
import { addFraudCheckJob } from "../jobs/fraud.job.js";
// Removed: import { addAIDecisionJob } from "../jobs/ai.job.js";
// AI decision is now handled by donation.worker.js only

class WorkflowEngine {
  /**
   * Handle donation created event
   * Creates audit log only - AI evaluation is handled by donation.worker.js
   * @param {Object} donation - Donation document
   */
  async handleDonationCreated(donation) {
    // Only create audit log - don't call AI here
    // AI evaluation is handled by donation.worker.js to avoid duplicates
    await createAuditLog({
      eventType: "DONATION_CREATED",
      eventCategory: "DONATION",
      entityId: donation._id.toString(),
      entityType: "Donation",
      campaignId: donation.campaign,
      jobIdHash: donation.jobIdHash,
      actorRole: "SYSTEM",
      payload: {
        donationId: donation._id.toString(),
        amount: donation.amount,
        status: donation.status,
      },
    });

    // Note: AI decision job is NOT added here
    // It's handled by the donation.worker.js after the donation is queued
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

  async initializeCampaignWorkflow(campaignId) {
    await createAuditLog({
      eventType: "CAMPAIGN_WORKFLOW_INITIALIZED",
      eventCategory: "CAMPAIGN",
      entityId: campaignId,
      entityType: "Campaign",
      actorRole: "SYSTEM",
      payload: {
        campaignId,
        message: "Campaign workflow initialized successfully",
      },
    });

    // Future: Initialize workflow state machine, set up monitoring, etc.
    return { success: true, campaignId };
  }
}

export default new WorkflowEngine();
