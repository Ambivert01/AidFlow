import axios from "axios";
import { logger } from "../../utils/logger.js";
import { aiConfig } from "../../config/ai.config.js";

class AIService {
  constructor() {
    // Each agent runs on its own port with its own endpoint path
    this.urls = {
      eligibility: aiConfig.eligibilityURL, // http://localhost:8001
      fraud: aiConfig.fraudURL, // http://localhost:8002
      risk: aiConfig.riskURL, // http://localhost:8003
      proof: aiConfig.proofURL, // http://localhost:8004
    };
    this.timeout = 8000;
  }

  async callAI(url, payload, type) {
    if (!url) {
      logger.warn({
        type: "AI_SKIPPED",
        service: type,
        reason: "URL_NOT_CONFIGURED",
      });
      return this.mockResponse(type);
    }
    try {
      const response = await axios.post(url, payload, {
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      logger.error({ type: "AI_ERROR", service: type, message: error.message });
      return this.mockResponse(type);
    }
  }

  // Eligibility agent: POST /check
  async evaluateBeneficiaryEligibility(data) {
    return this.callAI(
      this.urls.eligibility ? `${this.urls.eligibility}/check` : null,
      {
        beneficiary: {
          location: { ward: data.location?.ward || "" },
          documents: data.documents || [],
          pastAidCount: data.pastAidCount || 0,
          familySize: data.familySize || 1,
          vulnerabilityScore: data.vulnerabilityScore || 0,
          displacementStatus: data.displacementStatus || "UNKNOWN",
        },
        disaster: {
          type: data.disasterType || "OTHER",
          affectedWards: data.affectedWards || [],
          severity: data.severity || 1.0,
        },
      },
      "eligibility",
    );
  }

  // Fraud agent: POST /detect
  async evaluateFraudProbability(data) {
    return this.callAI(
      this.urls.fraud ? `${this.urls.fraud}/detect` : null,
      {
        beneficiaryId: String(data.beneficiaryId || ""),
        walletId: String(data.walletId || ""),
        deviceFingerprint: data.deviceFingerprint || "UNKNOWN",
        location: data.location || "",
        recentTransactions: data.recentTransactions || 0,
        totalAidReceived: data.totalAidReceived || 0,
        merchantId: String(data.merchantId || ""),
        timeWindowHours: data.timeWindowHours || 24,
      },
      "fraud",
    );
  }

  // Risk agent: POST /evaluate
  async evaluateRisk(eligibilityResult, fraudResult, policy) {
    return this.callAI(
      this.urls.risk ? `${this.urls.risk}/evaluate` : null,
      {
        eligibility: {
          eligible: eligibilityResult.eligible ?? true,
          confidence: eligibilityResult.confidence ?? 0.75,
        },
        fraud: {
          fraudRisk: fraudResult.fraudRisk || "LOW",
          riskScore: fraudResult.riskScore || 0.1,
        },
        policy: {
          maxAllowedRisk: policy?.maxFraudRisk || 0.4,
          minEligibilityConfidence: policy?.minEligibilityConfidence || 0.6,
        },
      },
      "risk",
    );
  }

  // NOTE: Donation risk is evaluated by composing evaluateFraudProbability()
  // + evaluateRisk() directly in donation.worker.js — see that file for the
  // full pipeline. A single-call shortcut used to exist here but it called
  // the fraud agent alone, which cannot produce the decision/0-100 score the
  // worker needs, so it was removed in favor of the explicit two-step call.

  // Campaign risk evaluation — deterministic rule-based scoring.
  // No dedicated "campaign risk" agent exists; the risk_agent's schema is
  // shaped for {eligibility, fraud, policy} (per-beneficiary), which campaign
  // data cannot honestly be mapped into. This computes a real score locally
  // instead of sending a payload the agent would reject.
  async evaluateCampaignRisk(data) {
    const flags = [];
    let riskScore = 10; // baseline: low risk

    const targetAmount = data.targetAmount || 0;
    const hasValidLocation = !!(data.location?.state && data.location?.district);
    const ngoVerified = data.ngoVerificationStatus === "APPROVED";
    const ngoPastCampaigns = data.ngoPastCampaigns || 0;
    const ngoSuccessRate = data.ngoSuccessRate ?? 1;

    // Unreasonable target amount
    if (targetAmount <= 0) {
      riskScore += 40;
      flags.push("INVALID_TARGET_AMOUNT");
    } else if (targetAmount > 10000000) {
      riskScore += 25;
      flags.push("UNUSUALLY_HIGH_TARGET_AMOUNT");
    }

    // Missing location
    if (!hasValidLocation) {
      riskScore += 15;
      flags.push("MISSING_OR_INVALID_LOCATION");
    }

    // NGO verification status
    if (!ngoVerified) {
      riskScore += 20;
      flags.push("NGO_NOT_VERIFIED");
    }

    // First-time NGO with no track record
    if (ngoPastCampaigns === 0) {
      riskScore += 10;
      flags.push("FIRST_TIME_NGO_CAMPAIGN");
    } else if (ngoSuccessRate < 0.5) {
      riskScore += 20;
      flags.push("LOW_NGO_SUCCESS_RATE");
    }

    // Thin description (likely low-effort or fraudulent listing)
    if (!data.description || data.description.trim().length < 50) {
      riskScore += 10;
      flags.push("INSUFFICIENT_DESCRIPTION");
    }

    riskScore = Math.min(100, riskScore);

    const decision =
      riskScore >= 70 ? "MANUAL_REVIEW" : riskScore >= 40 ? "ALLOW_WITH_MONITORING" : "ALLOW";

    return {
      riskScore,
      decision,
      flags,
      reason:
        flags.length > 0
          ? `Campaign risk factors: ${flags.join(", ")}`
          : "No significant risk factors detected",
      confidence: 0.9,
    };
  }

  // Proof validation - calls the real proof agent. (proof.worker.js calls
  // the proof agent directly via fetch for the main pipeline; this exists
  // so any other caller going through ai.service.js gets real behavior too
  // instead of a silent mock.)
  async validateProof(data) {
    return this.callAI(
      this.urls.proof ? `${this.urls.proof}/validate` : null,
      {
        proofId: data.proofId,
        fileUrls: data.fileUrls || [],
        proofType: data.proofType,
        campaignId: data.campaignId,
        merchantId: data.merchantId || null,
        expectedAmount: data.expectedAmount ?? null,
        location: data.location,
        capturedAt: data.capturedAt,
        campaignLocation: data.campaignLocation,
        campaignPeriod: data.campaignPeriod,
      },
      "proof-validation",
    );
  }

  // No dedicated anomaly-detection agent exists in this system. Rather than
  // silently returning fabricated confidence numbers, this is explicit about
  // not being implemented so callers (and anyone reading audit logs) don't
  // mistake a mock for a real signal.
  async detectAnomaly(data) {
    return {
      implemented: false,
      reason:
        "No anomaly-detection agent is configured. This is a placeholder, not a real risk signal.",
    };
  }

  mockResponse(type) {
    switch (type) {
      case "eligibility":
        return {
          eligible: true,
          confidence: 0.82,
          signals: {},
          reason: "Mock: eligible",
          xai_explanation: null,
        };
      case "fraud":
        return {
          fraudRisk: "LOW",
          riskScore: 0.1,
          flags: [],
          explanation: "Mock: no fraud detected",
        };
      case "risk":
        return {
          finalRiskScore: 10,
          decision: "ALLOW",
          reason: "Mock: all clear",
          escalate: false,
        };
      case "campaign-risk":
        return {
          riskScore: 15,
          decision: "ALLOW",
          flags: [],
          reason: "Mock: campaign appears legitimate",
          confidence: 0.85,
        };
      case "proof-validation":
        return {
          decision: "FLAGGED",
          confidenceScore: 0.5,
          fraudProbability: 0.5,
          flags: ["AI_SERVICE_UNAVAILABLE"],
          details: { reason: "Proof agent unreachable - defaulted to manual review" },
        };
      case "anomaly-detection":
        return { anomalyScore: 0.1 };
      default:
        return { status: "SKIPPED" };
    }
  }
}

export default new AIService();
