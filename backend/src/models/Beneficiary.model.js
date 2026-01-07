import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    // Link to User account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Campaign under which beneficiary is registered
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    // LIFECYCLE STATUS (AUTHORITATIVE)
    status: {
      type: String,
      enum: [
        "REGISTERED",
        "AI_APPROVED",
        "AI_FLAGGED",
        "NGO_APPROVED",
        "NGO_REJECTED",
        "ACTIVE",
        "BLOCKED",
        "EXPIRED",
      ],
      default: "REGISTERED",
    },

    // AI DECISION SNAPSHOT (IMMUTABLE)
    aiDecision: {
      eligibility: {
        eligible: Boolean,
        confidence: Number,
        signals: Object,
      },

      fraud: {
        riskScore: Number,
        fraudRisk: String,
        flags: [String],
      },

      risk: {
        finalRiskScore: Number,
        decision: {
          type: String, // ALLOW | MANUAL_REVIEW | BLOCK
        },
      },

      evaluatedAt: Date,
    },

    // GOVERNANCE & TRACEABILITY
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // NGO user
      required: true,
    },

    ngoDecision: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      decision: String,
      reason: String,
      decidedAt: Date,
    },

    overrideByNgo: {
      decision: String,
      reason: String,
      overriddenAt: Date,
    },
  },
  { timestamps: true }
);

export const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);
