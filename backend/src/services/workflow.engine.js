/*
 * Workflow Engine
 * Governs the lifecycle of a donation → distribution
 * This is the CORE execution brain of AidFlow
 */

export class WorkflowEngine {
  constructor({ policyEngine, walletEngine, auditService, aiClients }) {
    this.policyEngine = policyEngine;
    this.walletEngine = walletEngine;
    this.auditService = auditService;
    this.aiClients = aiClients;
  }

  /*
   * Entry point when donation is received
   */
  async processDonation({ donation, campaign, beneficiary }) {
    let state = "DONATION_RECEIVED";

    // STEP 0: Donation received
    await this.auditService.log({
      eventType: "DONATION_RECEIVED",
      payload: {
        donationId: donation._id,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });

    // STEP 1: Eligibility (AI + Policy)
    state = await this.verifyEligibility({
      donation,
      campaign,
      beneficiary,
    });

    // STEP 2: Risk Assessment (AI)
    state = await this.assessRisk({
      donation,
      beneficiary,
      campaign,
    });

    // STEP 3: Lock Funds
    state = await this.lockFunds({
      donation,
      beneficiary,
      campaign,
    });

    // STEP 4: Funds ready for use
    state = await this.distributeFunds({
      donation,
      beneficiary,
      campaign,
    });

    // STEP 5: Workflow completed
    await this.auditService.log({
      eventType: "WORKFLOW_COMPLETED",
      payload: {
        donationId: donation._id,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });

    // FINAL STEP: Merkle + Blockchain anchoring
    await this.auditService.finalizeWorkflowAudit({
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    return state;
  }

  // ELIGIBILITY CHECK (AI + POLICY)
  async verifyEligibility({ donation, campaign, beneficiary }) {
    const policy = campaign.policySnapshot;

    // AI eligibility agent
    const aiResult = await this.aiClients.eligibility.check({
      beneficiary: {
        id: beneficiary._id.toString(),
        location: {
          ward: campaign.location?.ward || "UNKNOWN",
          lat: 0,
          lng: 0,
        },
        documents: [],
        deviceFingerprint: beneficiary._id.toString(),
        pastAidCount: 0,
      },
      disaster: {
        type: campaign.disasterType,
        affectedWards: campaign.location?.ward ? [campaign.location.ward] : [],
        severity: 0.7,
      },
    });

    if (!aiResult.eligible) {
      await this.auditService.log({
        eventType: "ELIGIBILITY_FAILED",
        payload: {
          donationId: donation._id,
          reason: aiResult.reason,
        },
        jobIdHash: donation._id.toString(),
        campaignId: campaign._id,
        actorRole: "AI",
      });

      throw new Error("Beneficiary not eligible");
    }

    // Policy engine enforcement
    const policyResult = this.policyEngine.validateBeneficiary({
      beneficiary,
      policy,
    });

    if (!policyResult.allowed) {
      await this.auditService.log({
        eventType: "POLICY_REJECTED",
        payload: {
          donationId: donation._id,
          reason: policyResult.reason,
        },
        jobIdHash: donation._id.toString(),
        campaignId: campaign._id,
        actorRole: "SYSTEM",
      });

      throw new Error("Policy rejected beneficiary");
    }

    await this.auditService.log({
      eventType: "ELIGIBILITY_VERIFIED",
      payload: {
        donationId: donation._id,
        confidence: aiResult.confidence,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
      actorRole: "AI",
    });

    return "ELIGIBILITY_VERIFIED";
  }

  // RISK ASSESSMENT (AI – FRAUD / MISUSE)
  async assessRisk({ donation, beneficiary, campaign }) {
    const risk = await this.aiClients.risk.assess({
      beneficiary,
      amount: donation.amount,
    });

    // AI returns 0–100
    const riskScore = risk.finalRiskScore;
    const maxAllowedRisk = (campaign.policySnapshot.maxFraudRisk ?? 0.7) * 100;

    await this.auditService.log({
      eventType: "RISK_ASSESSED",
      payload: {
        donationId: donation._id,
        score: riskScore,
        decision: risk.decision,
        reason: risk.reason,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
      actorRole: "AI",
    });

    if (riskScore > maxAllowedRisk || risk.decision === "MANUAL_REVIEW") {
      throw new Error("High risk detected, manual review required");
    }

    return "RISK_ASSESSED";
  }

  // LOCK FUNDS INTO BENEFICIARY WALLET
  async lockFunds({ donation, beneficiary, campaign }) {
    await this.walletEngine.lock({
      donationId: donation._id,
      beneficiaryId: beneficiary._id,
      amount: donation.amount,
      policy: campaign.policySnapshot,
      campaignId: campaign._id, 
      jobIdHash: donation._id.toString(),
    });

    return "FUNDS_LOCKED";
  }

  // MARK FUNDS READY FOR USE (BENEFICIARY)
  async distributeFunds({ donation, beneficiary, campaign }) {
    await this.auditService.log({
      eventType: "FUNDS_READY_FOR_USE",
      payload: {
        donationId: donation._id,
        beneficiaryId: beneficiary._id,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
      actorRole: "SYSTEM",
    });

    return "READY_FOR_USE";
  }

  // RESUME AFTER NGO APPROVAL (MANUAL PATH)
  async resumeAfterNGOApproval({ donation, campaign }) {
    const beneficiary = donation.beneficiary;

    if (!beneficiary) {
      throw new Error("Beneficiary not assigned to donation");
    }

    // Lock funds
    await this.lockFunds({
      donation,
      beneficiary,
      campaign,
    });

    donation.status = "FUNDS_LOCKED";
    donation.lastDecisionBy = "SYSTEM";
    await donation.save();

    donation.status = "READY_FOR_USE";
    await donation.save();

    // Finalize audit chain
    await this.auditService.finalizeWorkflowAudit({
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    return "READY_FOR_USE";
  }
}
