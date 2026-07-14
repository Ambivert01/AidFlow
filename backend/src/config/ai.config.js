import { env } from "./env.config.js";

export const aiConfig = {

  eligibilityURL: env.AI_ELIGIBILITY_URL,

  fraudURL: env.AI_FRAUD_URL,

  riskURL: env.AI_RISK_URL,

  proofURL: env.AI_PROOF_URL,

};