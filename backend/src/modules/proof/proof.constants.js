// Proof Types
export const PROOF_TYPE = {
  PURCHASE_RECEIPT: "PURCHASE_RECEIPT",
  AID_DELIVERY: "AID_DELIVERY",
  BENEFICIARY_CONFIRMATION: "BENEFICIARY_CONFIRMATION",
  MERCHANT_INVOICE: "MERCHANT_INVOICE",
  FIELD_REPORT: "FIELD_REPORT",
  OTHER: "OTHER",
};

// Proof Status
export const PROOF_STATUS = {
  UPLOADED: "UPLOADED",
  UNDER_VALIDATION: "UNDER_VALIDATION",
  AI_VERIFIED: "AI_VERIFIED",
  FLAGGED: "FLAGGED",
  MANUAL_REVIEW: "MANUAL_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// AI Decision Types
export const AI_DECISION = {
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  FLAGGED: "FLAGGED",
};

// Manual Review Decisions
export const MANUAL_REVIEW_DECISION = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// AI Fraud Flags
export const FRAUD_FLAGS = {
  DUPLICATE_FILE: "DUPLICATE_FILE",
  AMOUNT_MISMATCH: "AMOUNT_MISMATCH",
  OCR_FAILED: "OCR_FAILED",
  LOCATION_MISMATCH: "LOCATION_MISMATCH",
  INVALID_TIMESTAMP: "INVALID_TIMESTAMP",
  TIMESTAMP_OUT_OF_RANGE: "TIMESTAMP_OUT_OF_RANGE",
  REPEATED_VENDOR: "REPEATED_VENDOR",
  REUSED_ACROSS_CAMPAIGNS: "REUSED_ACROSS_CAMPAIGNS",
};

// Audit Event Types
export const PROOF_AUDIT_EVENTS = {
  PROOF_UPLOADED: "PROOF_UPLOADED",
  PROOF_STATUS_CHANGED: "PROOF_STATUS_CHANGED",
  PROOF_MANUALLY_REVIEWED: "PROOF_MANUALLY_REVIEWED",
  PROOF_ANCHORED: "PROOF_ANCHORED",
};

// Notification Types
export const PROOF_NOTIFICATION_TYPES = {
  PROOF_REJECTED: "PROOF_REJECTED",
  PROOF_VERIFIED: "PROOF_VERIFIED",
};

// Error Messages
export const PROOF_ERROR_MESSAGES = {
  PROOF_NOT_FOUND: "Proof not found",
  CAMPAIGN_NOT_FOUND: "Campaign not found",
  CAMPAIGN_UNAUTHORIZED: "Campaign not found or unauthorized",
  INVALID_PROOF_TYPE: "Invalid proof type",
  INVALID_FILE_TYPE: "Invalid file type",
  FILE_SIZE_EXCEEDED: "File size exceeds maximum allowed size of 50MB",
  FILE_UPLOAD_FAILED: "File upload failed",
  STORAGE_CAPACITY_EXCEEDED: "Storage capacity exceeded",
  INVALID_STATUS_TRANSITION: "Invalid status transition",
  MANUAL_REVIEW_REQUIRED: "Manual review required for flagged proofs",
  UNAUTHORIZED_ACCESS: "Unauthorized access to proof",
  INVALID_DECISION: "Invalid review decision",
};

// File Validation
export const FILE_VALIDATION = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES: 5,
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/mov",
    "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// AI Validation Thresholds
export const AI_THRESHOLDS = {
  VERIFIED_CONFIDENCE: 0.8,
  VERIFIED_FRAUD_MAX: 0.3,
  REJECTED_FRAUD_MIN: 0.6,
  DUPLICATE_FRAUD_PROBABILITY: 0.7,
  REPEATED_VENDOR_COUNT: 5,
  REPEATED_VENDOR_DAYS: 7,
  LOCATION_MISMATCH_KM: 50,
  OCR_CONFIDENCE_PENALTY: 0.2,
  FRAUD_FLAG_THRESHOLD: 2,
  FRAUD_FLAG_PROBABILITY: 0.6,
};

// Performance Targets
export const PERFORMANCE_TARGETS = {
  UPLOAD_RESPONSE_TIME_MS: 3000,
  CAMPAIGN_PROOFS_RESPONSE_TIME_MS: 1000,
  DONOR_TIMELINE_RESPONSE_TIME_MS: 2000,
  AI_VALIDATION_TIME_MS: 30000,
  BLOCKCHAIN_ANCHOR_TIME_MS: 60000,
};

// Cache Configuration
export const CACHE_CONFIG = {
  CAMPAIGN_PROOFS_TTL: 300, // 5 minutes
  DONOR_TIMELINE_TTL: 300, // 5 minutes
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
