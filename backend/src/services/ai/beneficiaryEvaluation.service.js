export async function evaluateBeneficiaryAI({ aadhaarHash, location }) {
  // MOCK AI — replace later with real model
  const eligibilityConfidence = Math.random();
  const fraudRisk = Math.random();

  let decision = "ALLOW";

  if (fraudRisk > 0.7) decision = "BLOCK";
  else if (eligibilityConfidence < 0.6) decision = "MANUAL_REVIEW";

  return {
    eligibility: {
      eligible: decision !== "BLOCK",
      confidence: eligibilityConfidence,
      signals: { location },
    },
    fraud: {
      riskScore: fraudRisk,
      fraudRisk: fraudRisk > 0.7 ? "HIGH" : "LOW",
      flags: fraudRisk > 0.7 ? ["DUPLICATE_PATTERN"] : [],
    },
    risk: {
      finalRiskScore: (fraudRisk + (1 - eligibilityConfidence)) / 2,
      decision,
    },
  };
}
