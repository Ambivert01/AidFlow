/**
 * Policy Engine
 * Converts human rules into enforceable constraints
 */

export class PolicyEngine {
  constructor(globalPolicy = {}) {
    this.globalPolicy = globalPolicy;
  }

  /**
   * Merge global + campaign policies
   */
  buildEffectivePolicy(campaignPolicy) {
    return {
      ...this.globalPolicy,
      ...campaignPolicy,
    };
  }

  /**
   * Validate beneficiary eligibility against policy
   */
  validateBeneficiary({ beneficiary, policy }) {
    // Location check
    if (policy.ward && beneficiary.ward !== policy.ward) {
      return { allowed: false, reason: "Location mismatch" };
    }

    // Amount cap
    if (beneficiary.requestedAmount > policy.maxPerBeneficiary) {
      return { allowed: false, reason: "Amount exceeds policy limit" };
    }

    // Cooldown check
    if (
      beneficiary.lastAidAt &&
      Date.now() - beneficiary.lastAidAt < policy.cooldownDays * 86400000
    ) {
      return { allowed: false, reason: "Cooldown active" };
    }

    return { allowed: true };
  }

  /**
   * Validate spending category
   */
  validateSpending({ category, policy }) {
    if (!policy.allowedCategories.includes(category)) {
      return { allowed: false, reason: "Category not allowed" };
    }
    return { allowed: true };
  }
}
