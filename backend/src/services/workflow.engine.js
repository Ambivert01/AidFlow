// backend/src/services/workflow.engine.js

import { Beneficiary } from "../models/Beneficiary.model.js";
import { createWallet } from "./wallet.service.js";

export class WorkflowEngine {
  constructor({ policyEngine, walletEngine, auditService, aiClients }) {
    this.policyEngine = policyEngine;
    this.walletEngine = walletEngine; // only used for spending
    this.auditService = auditService;
    this.aiClients = aiClients;
  }

  /*
   * STEP 0: Full donation intake workflow (AI + policy)
   * Called immediately after donation creation.
   *
   * NOTE:
   * - If a beneficiary is NOT yet assigned, we simply route the donation
   *   into NGO review and let NGO assign a beneficiary later.
   * - If a beneficiary IS present, we run the full AI pipeline.
   */
  async processDonation({ donation, campaign, beneficiary }) {
    const jobIdHash = donation._id.toString();

    // If no beneficiary is attached yet, route to NGO review directly.
    if (!beneficiary) {
      donation.status = "PENDING_NGO_REVIEW";
      donation.lastDecisionBy = "SYSTEM";
      donation.reviewReason = "Beneficiary to be assigned by NGO";
      await donation.save();

      await this.auditService.log({
        eventType: "DONATION_PENDING_NGO_REVIEW",
        payload: {
          donationId: donation._id,
          reason: "NO_BENEFICIARY_ASSIGNED",
        },
        jobIdHash,
        campaignId: campaign._id,
        actorRole: "SYSTEM",
      });

      return;
    }

    // 1 AI evaluate beneficiary
    const evaluatedBeneficiary = await this.evaluateBeneficiary({
      beneficiary,
      campaign,
      jobIdHash,
    });

    // 2 Decision routing
    if (evaluatedBeneficiary.status === "BLOCKED") {
      donation.status = "ELIGIBILITY_FAILED";
      donation.lastDecisionBy = "AI";
      donation.decisionReason = "AI blocked beneficiary";
      await donation.save();

      await this.auditService.log({
        eventType: "DONATION_ELIGIBILITY_FAILED",
        payload: { donationId: donation._id, reason: "AI_BLOCK" },
        jobIdHash,
        campaignId: campaign._id,
        actorRole: "AI",
      });
      return;
    }

    if (evaluatedBeneficiary.status === "REGISTERED") {
      donation.status = "PENDING_NGO_REVIEW";
      donation.lastDecisionBy = "AI";

      donation.reviewReason = "AI confidence below threshold";
      donation.aiDecision =
        evaluatedBeneficiary.aiDecision?.decision || "MANUAL_REVIEW";
      donation.aiRiskScore =
        evaluatedBeneficiary.aiDecision?.fraudRisk ??
        evaluatedBeneficiary.aiDecision?.finalRiskScore ??
        null;

      await donation.save();

      await this.auditService.log({
        eventType: "DONATION_PENDING_NGO_REVIEW",
        payload: { donationId: donation._id, reason: "AI_MANUAL_REVIEW_REQUIRED" },
        jobIdHash,
        campaignId: campaign._id,
        actorRole: "AI",
      });
      return;
    }

    // 3 Eligible → go to NGO (controlled approval)
    donation.status = "PENDING_NGO_REVIEW";
    donation.lastDecisionBy = "SYSTEM";
    donation.reviewReason = "Eligible but requires NGO authorization";
    await donation.save();

    await this.auditService.log({
      eventType: "DONATION_PENDING_NGO_REVIEW",
      payload: { donationId: donation._id, reason: "SYSTEM_ROUTING" },
      jobIdHash,
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });
  }

  /*
   * STEP 1: Run AI evaluation for a beneficiary (NGO onboarding)
   */
  async evaluateBeneficiary({ beneficiary, campaign, jobIdHash }) {
    // 1 Eligibility AI
    const eligibility = await this.aiClients.eligibility.check({
      beneficiary,
      disaster: {
        type: campaign.disasterType,
        affectedWards: [campaign.location?.ward],
        severity: 1,
      },
    });

    // 2 Fraud AI
    const fraud = await this.aiClients.fraud.detect({
      beneficiaryId: beneficiary.user,
      walletId: null,
      deviceFingerprint: beneficiary.deviceFingerprint || "NA",
      location: campaign.location?.ward,
      recentTransactions: 0,
      totalAidReceived: 0,
      merchantId: null,
      timeWindowHours: 24,
    });

    // 3 Risk AI
    const risk = await this.aiClients.risk.assess({
      eligibility,
      fraud,
      policy: {
        maxAllowedRisk: campaign.policySnapshot.maxFraudRisk,
        minEligibilityConfidence:
          campaign.policySnapshot.minEligibilityConfidence,
      },
    });

    // 4 Persist AI decision (IMMUTABLE)
    beneficiary.aiDecision = {
      eligibilityConfidence: eligibility.confidence,
      fraudRisk: fraud.riskScore,
      decision: risk.decision,
      flags: fraud.flags,
      evaluatedAt: new Date(),
    };

    if (risk.decision === "BLOCK") {
      beneficiary.status = "BLOCKED";
    } else if (risk.decision === "MANUAL_REVIEW") {
      beneficiary.status = "MANUAL_REVIEW";
    } else {
      beneficiary.status = "ELIGIBLE";
    }

    await beneficiary.save();

    // 5 Audit AI decision
    await this.auditService.log({
      eventType: "BENEFICIARY_AI_EVALUATED",
      payload: {
        beneficiaryId: beneficiary._id,
        decision: risk.decision,
      },
      jobIdHash,
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });

    return beneficiary;
  }

  /*
   * STEP 2: Resume workflow AFTER NGO approval of donation
   */
  async resumeAfterNGOApproval({ donation, campaign }) {
    const jobIdHash = donation._id.toString();

    if (!donation.beneficiary) {
      donation.status = "ELIGIBILITY_FAILED";
      donation.decisionReason = "No beneficiary assigned";
      await donation.save();
      return;
    }

    const beneficiary = await Beneficiary.findById(donation.beneficiary);
    if (!beneficiary) {
      donation.status = "ELIGIBILITY_FAILED";
      donation.decisionReason = "Beneficiary not found";
      await donation.save();
      return;
    }

    // SECURITY GUARD: Ensure AI assessment was successful
    if (!beneficiary.aiDecision) {
      throw new Error("Cannot resume workflow: Beneficiary has no AI risk assessment");
    }

    donation.status = "WALLET_CREATING";
    await donation.save();

    const wallet = await createWallet({
      beneficiaryId: donation.beneficiary,
      campaign,
      amount: donation.amount,
      jobIdHash,
    });

    donation.status = "READY_FOR_USE";
    await donation.save();

    await this.auditService.log({
      eventType: "DONATION_READY_FOR_USE",
      payload: {
        donationId: donation._id,
        walletId: wallet._id,
      },
      jobIdHash,
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });

    await this.auditService.finalizeWorkflowAudit({
      jobIdHash,
      campaignId: campaign._id,
    });

    donation.status = "AUDIT_FINALIZED";
    await donation.save();

    return wallet;
  }

  /**
   * STEP 3: Get workflow status (NGO dashboard)
   */
  async getWorkflowStatus(campaignId) {
    const total = await Donation.countDocuments({ campaign: campaignId });
    const ready = await Donation.countDocuments({
      campaign: campaignId,
      status: "READY_FOR_USE",
    });

    return {
      state: "RUNNING",
      verifiedCount: total,
      disbursedCount: ready,
    };
  }
}
