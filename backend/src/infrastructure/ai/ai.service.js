import axios from "axios";
import { logger } from "../../utils/logger.js";

class AIService {
  constructor() {
    // Each agent runs on its own port with its own endpoint path
    this.urls = {
      eligibility: process.env.AI_ELIGIBILITY_URL,   // http://localhost:8001
      fraud: process.env.AI_FRAUD_URL,               // http://localhost:8002
      risk: process.env.AI_RISK_URL,                 // http://localhost:8003
    };
    this.timeout = 8000;
  }

  async callAI(url, payload, type) {
    if (!url) {
      logger.warn({ type: "AI_SKIPPED", service: type, reason: "URL_NOT_CONFIGURED" });
      return this.mockResponse(type);
    }
    try {
      const response = await axios.post(url, payload, { timeout: this.timeout });
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
      "eligibility"
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
      "fraud"
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
      "risk"
    );
  }

  // Donation risk — uses fraud agent with donation signals
  async evaluateDonationRisk(data) {
    return this.callAI(
      this.urls.fraud ? `${this.urls.fraud}/detect` : null,
      {
        beneficiaryId: String(data.donorId || ""),
        walletId: "DONATION",
        deviceFingerprint: "UNKNOWN",
        location: "",
        recentTransactions: data.frequency || 0,
        totalAidReceived: data.amount || 0,
        merchantId: "",
        timeWindowHours: 24,
      },
      "fraud"
    );
  }

  // Proof validation — uses eligibility agent as proxy (no dedicated agent yet)
  async validateProof(data) {
    return this.mockResponse("proof-validation");
  }

  // Anomaly detection fallback
  async detectAnomaly(data) {
    return this.mockResponse("anomaly-detection");
  }

  mockResponse(type) {
    switch (type) {
      case "eligibility":
        return { eligible: true, confidence: 0.82, signals: {}, reason: "Mock: eligible", xai_explanation: null };
      case "fraud":
        return { fraudRisk: "LOW", riskScore: 0.1, flags: [], explanation: "Mock: no fraud detected" };
      case "risk":
        return { finalRiskScore: 10, decision: "ALLOW", reason: "Mock: all clear", escalate: false };
      case "proof-validation":
        return { valid: true, confidence: 0.9, flags: [] };
      case "anomaly-detection":
        return { anomalyScore: 0.1 };
      default:
        return { status: "SKIPPED" };
    }
  }
}

export default new AIService();
