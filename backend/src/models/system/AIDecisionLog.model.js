import mongoose from "mongoose";

const aiDecisionLogSchema = new mongoose.Schema(
  {
    // MODEL INFORMATION
    modelName: {
      type: String,
      required: true,
      index: true,
    },

    modelVersion: {
      type: String,
      required: true,
    },

    // DECISION TYPE
    decisionType: {
      type: String,
      enum: [
        "BENEFICIARY_ELIGIBILITY",
        "FRAUD_DETECTION",
        "PROOF_VERIFICATION",
        "TRANSACTION_ANOMALY",
        "MERCHANT_RISK",
        "DONATION_RISK",
      ],
      required: true,
    },

    // TARGET ENTITY
    entityType: {
      type: String,
      enum: [
        "Beneficiary",
        "Wallet",
        "Merchant",
        "Donation",
        "Proof",
        "Transaction",
      ],
      required: true,
      index: true,
    },

    entityId: {
      type: String,
      required: true,
      index: true,
    },

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },

    // INPUT FEATURES
    inputFeatures: {
      type: Object,
      default: {},
    },

    // DECISION OUTPUT
    decision: {
      type: String,
      required: true,
    },

    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    flags: {
      type: [String],
      default: [],
    },

    reason: {
      type: String,
      default: null,
    },

    // ACTION TAKEN
    actionTaken: {
      type: String,
      enum: ["NONE", "FLAGGED", "BLOCKED", "ESCALATED", "APPROVED"],
      default: "NONE",
    },

    // EXECUTION METADATA
    executionTimeMs: {
      type: Number,
      default: null,
    },

    evaluatedAt: {
      type: Date,
      default: Date.now,
    },

    // SYSTEM TRACE
    jobIdHash: {
      type: String,
      default: null,
      index: true,
    },

    auditLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditLog",
      default: null,
    },

    // SYSTEM METADATA
    metadata: {
      type: Object,
      default: {},
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

// INDEXES
aiDecisionLogSchema.index({ entityType: 1, entityId: 1 });
aiDecisionLogSchema.index({ decisionType: 1 });
aiDecisionLogSchema.index({ modelName: 1, modelVersion: 1 });

export const AIDecisionLog = mongoose.model(
  "AIDecisionLog",
  aiDecisionLogSchema,
);
