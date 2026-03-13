// This module previously contained a random, non-deterministic mock AI.
// The real implementation now lives in the dedicated FastAPI agents,
// invoked via `backend/src/services/aiDecision.js`.
//
// We keep a minimal, deterministic fallback here only as a last-resort
// safety net if aiDecision clients are ever unavailable at import-time.

export async function evaluateBeneficiaryAI({ aadhaarHash, location }) {
  return {
    eligibility: {
      eligible: true,
      confidence: 0,
      signals: { location, source: "STATIC_FALLBACK" },
    },
    fraud: {
      riskScore: 0,
      fraudRisk: "LOW",
      flags: ["AI_STATIC_FALLBACK"],
    },
    risk: {
      finalRiskScore: 0,
      decision: "MANUAL_REVIEW",
    },
  };
}
