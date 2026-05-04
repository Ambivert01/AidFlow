import mongoose from "mongoose";

const trustLogSchema = new mongoose.Schema(
  {
    // ENTITY REFERENCE
    entityType: {
      type: String,
      enum: ["NGO", "CAMPAIGN", "MERCHANT"],
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // SCORE CHANGE
    oldScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    newScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    delta: {
      type: Number,
      required: true,
    },

    // REASON FOR CHANGE
    reason: {
      type: String,
      required: true,
    },

    triggerEvent: {
      type: String,
      enum: [
        "PROOF_VERIFIED",
        "PROOF_REJECTED",
        "DONATION_COMPLETED",
        "FRAUD_DETECTED",
        "AI_DECISION_LOGGED",
        "MANUAL_ADJUSTMENT",
        "INITIAL_CALCULATION",
      ],
      required: true,
    },

    // FACTOR BREAKDOWN
    factors: {
      proofScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      aiScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      timelinessScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      fraudPenalty: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      consistencyScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
    },

    // AUDIT TRAIL
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    relatedEntity: {
      type: String,
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
trustLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
trustLogSchema.index({ triggerEvent: 1 });

export const TrustLog = mongoose.model("TrustLog", trustLogSchema);
