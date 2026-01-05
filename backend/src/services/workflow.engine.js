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

    await this.auditService.log({
      eventType: "DONATION_RECEIVED",
      payload: {
        donationId: donation._id,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    // 1 Eligibility Check (AI + Policy)
    state = await this.verifyEligibility({ donation, campaign, beneficiary });

    // 2 Risk Assessment
    state = await this.assessRisk({ donation, beneficiary, campaign });

    // 3 Lock Funds
    state = await this.lockFunds({ donation, beneficiary, campaign });

    // 4 Distribution
    state = await this.distributeFunds({ donation, beneficiary, campaign });

    // 5 Final Audit
    await this.auditService.log({
      eventType: "WORKFLOW_COMPLETED",
      payload: {
        donationId: donation._id,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    await this.auditService.finalizeWorkflowAudit({
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    return state;
  }

  async verifyEligibility({ donation, campaign, beneficiary }) {
    const policy = campaign.policySnapshot;

    // AI eligibility check
    const aiResult = await this.aiClients.eligibility.check({
      beneficiary,
      donation,
      campaign,
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
      });
      throw new Error("Beneficiary not eligible");
    }

    // Policy enforcement
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
    });

    return "ELIGIBILITY_VERIFIED";
  }

  async assessRisk({ donation, beneficiary, campaign }) {
    const risk = await this.aiClients.risk.assess({
      beneficiary,
      amount: donation.amount,
    });

    await this.auditService.log({
      eventType: "RISK_ASSESSED",
      payload: {
        donationId: donation._id,
        score: risk.score,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
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

    await this.auditService.log({
      eventType: "FUNDS_LOCKED",
      payload: {
        donationId: donation._id,
        amount: donation.amount,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    return "FUNDS_LOCKED";
  }

  async distributeFunds({ donation, beneficiary, campaign }) {
    // Distribution means "READY FOR USE", not closing
    await this.auditService.log({
      eventType: "FUNDS_READY_FOR_USE",
      payload: {
        donationId: donation._id,
        beneficiaryId: beneficiary._id,
      },
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    return "READY_FOR_DISTRIBUTION";
  }

    /**
   * Resume workflow AFTER NGO approval
   * (Do NOT re-run eligibility / risk)
   */
  async resumeAfterNGOApproval({ donation, campaign }) {
    // 🔹 Resolve beneficiary (temporary logic)
    const beneficiary = await this.aiClients.eligibility.pickBeneficiary({
      campaignId: campaign._id,
    });

    if (!beneficiary) {
      throw new Error("No eligible beneficiary found");
    }

    // 🔹 Lock funds
    await this.lockFunds({
      donation,
      beneficiary,
      campaign,
    });

    // 🔹 Update donation status
    donation.status = "FUNDS_LOCKED";
    donation.lastDecisionBy = "SYSTEM";
    await donation.save();

    // 🔹 Mark ready for use
    donation.status = "READY_FOR_USE";
    await donation.save();

    // 🔹 Finalize audit (Merkle + blockchain)
    await this.auditService.finalizeWorkflowAudit({
      jobIdHash: donation._id.toString(),
      campaignId: campaign._id,
    });

    return "READY_FOR_USE";
  }

}
