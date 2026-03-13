import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
      sparse: true,
    },

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    // PII-safe identity hash (sha256 of Aadhaar)
    aadhaarHash: {
      type: String,
      index: true,
      sparse: true,
      default: null,
    },

    // Basic identity (non-PII)
    name: { type: String, default: null },
    phone: { type: String, default: null },

    // Location
    location: {
      ward: { type: String, default: null },
      district: { type: String, default: null },
      state: { type: String, default: null },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    // Vulnerability signals
    familySize: { type: Number, default: 1 },
    vulnerabilityScore: { type: Number, default: 0 }, // 0-100
    displacementStatus: {
      type: String,
      enum: ["DISPLACED", "PARTIAL", "STABLE", "UNKNOWN"],
      default: "UNKNOWN",
    },
    documents: { type: [String], default: [] }, // document proof refs

    status: {
      type: String,
      enum: [
        "REGISTERED",    // NGO or self-created
        "AI_EVALUATED",  // AI completed evaluation
        "ELIGIBLE",      // AI passed
        "BLOCKED",       // AI rejected
        "MANUAL_REVIEW", // AI unsure — needs human
        "NGO_APPROVED",  // NGO accepted (alias ACTIVE)
        "NGO_REJECTED",  // NGO rejected
        "ACTIVE",        // Wallet + donation allowed
      ],
      default: "REGISTERED",
    },

    aiDecision: {
      eligibilityConfidence: { type: Number, default: null },
      fraudRisk: { type: Number, default: null },
      decision: { type: String, default: null }, // ALLOW | ALLOW_WITH_MONITORING | MANUAL_REVIEW | BLOCK
      flags: { type: [String], default: [] },
      reason: { type: String, default: null },
      evaluatedAt: { type: Date, default: null },
    },

    overrideByNgo: {
      decision: { type: String, default: null },
      reason: { type: String, default: null },
      ngo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      at: { type: Date, default: null },
    },

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index: prevent same aadhaar in same campaign
beneficiarySchema.index(
  { aadhaarHash: 1, campaign: 1 },
  { unique: true, sparse: true }
);

export const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);
