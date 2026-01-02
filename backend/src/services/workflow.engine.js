/*
 * Workflow Engine
 * Governs the lifecycle of a donation → distribution
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

    await this.auditService.log("DONATION_RECEIVED", {
      donationId: donation._id,
    });

    // 1 Eligibility Check (AI + Policy)
    state = await this.verifyEligibility({ donation, campaign, beneficiary });

    // 2 Risk Assessment
    state = await this.assessRisk({ donation, beneficiary });

    // 3 Lock Funds
    state = await this.lockFunds({ donation, beneficiary, campaign });

    // 4 Distribution
    state = await this.distributeFunds({ donation, beneficiary });

    // 5 Final Audit
    await this.auditService.log("WORKFLOW_COMPLETED", {
      donationId: donation._id,
    });

    return state;
  }

    async verifyEligibility({ donation, campaign, beneficiary }) {
    const policy = campaign.policySnapshot;

    // AI eligibility check
    const aiResult = await this.aiClients.eligibility.check(beneficiary);

    if (!aiResult.eligible) {
      await this.auditService.log("ELIGIBILITY_FAILED", {
        reason: aiResult.reason,
      });
      throw new Error("Beneficiary not eligible");
    }

    // Policy enforcement
    const policyResult = this.policyEngine.validateBeneficiary({
      beneficiary,
      policy,
    });

    if (!policyResult.allowed) {
      await this.auditService.log("POLICY_REJECTED", {
        reason: policyResult.reason,
      });
      throw new Error("Policy rejected beneficiary");
    }

    await this.auditService.log("ELIGIBILITY_VERIFIED", {
      confidence: aiResult.confidence,
    });

    return "ELIGIBILITY_VERIFIED";
  }

    async assessRisk({ donation, beneficiary }) {
    const risk = await this.aiClients.risk.assess({
      beneficiary,
      amount: donation.amount,
    });

    await this.auditService.log("RISK_ASSESSED", {
      score: risk.score,
    });

    if (risk.score > 0.7) {
      throw new Error("High risk detected, manual review required");
    }

    return "RISK_ASSESSED";
  }

    async lockFunds({ donation, beneficiary, campaign }) {
    await this.walletEngine.lock({
      donationId: donation._id,
      beneficiaryId: beneficiary._id,
      amount: donation.amount,
      policy: campaign.policySnapshot,
    });

    await this.auditService.log("FUNDS_LOCKED", {
      amount: donation.amount,
    });

    return "FUNDS_LOCKED";
  }

    async distributeFunds({ donation, beneficiary }) {
    await this.walletEngine.release({
      donationId: donation._id,
      beneficiaryId: beneficiary._id,
    });

    await this.auditService.log("FUNDS_DISTRIBUTED", {
      beneficiaryId: beneficiary._id,
    });

    return "DISTRIBUTED";
  }
}
