// backend/src/services/workflow.engine.js

import { Donation } from "../models/Donation.model.js";
import { Beneficiary } from "../models/Beneficiary.model.js";
import { createWallet } from "./wallet.service.js";

export class WorkflowEngine {
  constructor({ policyEngine, walletEngine, auditService, aiClients }) {
    this.policyEngine = policyEngine;
    this.walletEngine = walletEngine; // only used for spending
    this.auditService = auditService;
    this.aiClients = aiClients;
  }

  /**
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

    beneficiary.status =
      risk.decision === "BLOCK"
        ? "BLOCKED"
        : risk.decision === "MANUAL_REVIEW"
        ? "REGISTERED"
        : "ELIGIBLE";

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

  /**
   * STEP 2: Resume workflow AFTER NGO approval of donation
   */
  async resumeAfterNGOApproval({ donation, campaign }) {
    const jobIdHash = donation._id.toString();

    // 1 Safety check
    if (!donation.beneficiary) {
      donation.status = "ELIGIBILITY_FAILED";
      donation.decisionReason = "No beneficiary assigned";
      await donation.save();
      return;
    }

    // 2 Create Wallet (SINGLE SOURCE OF TRUTH)
    await createWallet({
      beneficiaryId: donation.beneficiary,
      campaign,
      amount: donation.amount,
      jobIdHash,
    });

    donation.status = "FUNDS_LOCKED";
    donation.lastDecisionBy = "SYSTEM";
    await donation.save();

    // 3 Audit wallet creation (NEW EVENT)
    await this.auditService.log({
      eventType: "WALLET_CREATED",
      payload: {
        donationId: donation._id,
        beneficiaryId: donation.beneficiary,
        amount: donation.amount,
      },
      jobIdHash,
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });

    donation.status = "READY_FOR_USE";
    await donation.save();

    // 4 Audit disbursement
    await this.auditService.log({
      eventType: "DONATION_DISBURSED_TO_WALLET",
      payload: {
        donationId: donation._id,
        beneficiaryId: donation.beneficiary,
        amount: donation.amount,
      },
      jobIdHash,
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });

    return true;
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
