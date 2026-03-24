// src/infrastructure/ai/ai.service.js

import axios from "axios";
import logger from "../../utils/logger.js";

class AIService {
  constructor() {
    this.baseURL = process.env.AI_BASE_URL;

    this.timeout = 8000;
  }

  async request(model, payload) {
    try {
      const response = await axios.post(
        `${this.baseURL}/${model}`,

        payload,

        {
          timeout: this.timeout,
        },
      );

      return response.data;
    } catch (error) {
      logger.error({
        type: "AI_ERROR",

        model,

        message: error.message,
      });

      throw new Error("AI_SERVICE_FAILED");
    }
  }

  async evaluateDonationRisk(data) {
    return this.request(
      "donation-risk",

      {
        amount: data.amount,

        donorHistory: data.history,

        frequency: data.frequency,

        location: data.location,
      },
    );
  }

  async evaluateBeneficiaryEligibility(data) {
    return this.request(
      "beneficiary-eligibility",

      {
        incomeLevel: data.income,

        familySize: data.familySize,

        locationRisk: data.locationRisk,

        priorAid: data.previousAid,
      },
    );
  }

  async evaluateFraudProbability(data) {
    return this.request(
      "fraud-score",

      {
        entityType: data.type,

        signals: data.signals,
      },
    );
  }

  async validateProof(data) {
    return this.request(
      "proof-validation",

      {
        imageUrl: data.image,

        metadata: data.metadata,

        geoLocation: data.geo,
      },
    );
  }

  async detectAnomaly(data) {
    return this.request(
      "anomaly-detection",

      {
        transactions: data.transactions,
      },
    );
  }
}

export default new AIService();
