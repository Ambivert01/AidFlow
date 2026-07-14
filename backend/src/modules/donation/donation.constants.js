export const DONATION_STATUS = {
  // Initial states
  INITIATED: "INITIATED", // Donation created, awaiting processing
  CREATED: "CREATED", // Legacy - same as INITIATED

  // Payment states
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",

  // Processing states
  PROCESSING: "PROCESSING", // Worker processing donation
  AI_CHECK_PENDING: "AI_CHECK_PENDING", // Awaiting AI risk evaluation

  // Review states
  PENDING_NGO_REVIEW: "PENDING_NGO_REVIEW", // Low risk, awaiting NGO approval
  NGO_APPROVED: "NGO_APPROVED", // NGO approved
  APPROVED: "NGO_APPROVED", // Alias for NGO_APPROVED

  // Escalation states
  HIGH_RISK_ESCALATED: "HIGH_RISK_ESCALATED", // High risk, escalated to government
  ESCALATED: "HIGH_RISK_ESCALATED", // Alias for HIGH_RISK_ESCALATED
  APPROVED_BY_GOVT: "APPROVED_BY_GOVT", // Government approved

  // Wallet states
  WALLET_CREATING: "WALLET_CREATING",
  READY_FOR_USE: "READY_FOR_USE",

  // Terminal states
  BLOCKED: "REJECTED", // Alias for REJECTED
  REJECTED: "REJECTED",
  REFUNDED: "REFUNDED",
  COMPLETED: "AUDIT_FINALIZED", // Alias for AUDIT_FINALIZED
  AUDIT_FINALIZED: "AUDIT_FINALIZED",
  FAILED: "FAILED", // Processing failed
};

// Workflow state tracking
export const WORKFLOW_STATE = {
  PENDING: "PENDING",
  AI_EVALUATION: "AI_EVALUATION",
  NGO_REVIEW: "NGO_REVIEW",
  GOVT_REVIEW: "GOVT_REVIEW",
  WALLET_CREATION: "WALLET_CREATION",
  BLOCKCHAIN_ANCHORING: "BLOCKCHAIN_ANCHORING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

// AI Decision types
export const AI_DECISION = {
  ALLOW: "ALLOW",
  BLOCK: "BLOCK",
  ESCALATE: "ESCALATE",
  REVIEW: "REVIEW",
};
