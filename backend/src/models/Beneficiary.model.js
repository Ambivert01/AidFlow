import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },

  status: {
    type: String,
    enum: [
      "REGISTERED",
      "ELIGIBLE",
      "MANUAL_REVIEW",
      "BLOCKED",
      "NGO_APPROVED",
      "NGO_REJECTED",
      "ACTIVE",
    ],
    default: "REGISTERED",
  },

  aiDecision: {
    eligibilityConfidence: Number,
    fraudRisk: Number,
    decision: String, // ALLOW | MANUAL_REVIEW | BLOCK
    flags: [String],
    evaluatedAt: Date,
  },

  overrideByNgo: {
    decision: String,
    reason: String,
    overriddenAt: Date,
  },

  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);