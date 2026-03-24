import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    // USER LINK (OPTIONAL)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
      sparse: true,
    },

    // CAMPAIGN LINK
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    // PII-SAFE IDENTITY
    aadhaarHash: {
      type: String,
      index: true,
      sparse: true,
      default: null,
    },

    phoneHash: {
      type: String,
      index: true,
      sparse: true,
      default: null,
    },

    name: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    // LOCATION
    location: {
      ward: { type: String, default: null },
      district: { type: String, default: null },
      state: { type: String, default: null },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      geoHash: { type: String, default: null },
    },

    // HOUSEHOLD INFORMATION
    household: {
      familySize: { type: Number, default: 1 },

      dependents: { type: Number, default: 0 },

      elderlyCount: { type: Number, default: 0 },

      childrenCount: { type: Number, default: 0 },

      disabledMembers: { type: Number, default: 0 },
    },

    // VULNERABILITY SCORING
    vulnerabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    displacementStatus: {
      type: String,
      enum: ["DISPLACED", "PARTIAL", "STABLE", "UNKNOWN"],
      default: "UNKNOWN",
    },

    incomeLevel: {
      type: String,
      enum: ["NONE", "LOW", "MEDIUM", "UNKNOWN"],
      default: "UNKNOWN",
    },

    // DOCUMENT REFERENCES
    documents: {
      type: [String],
      default: [],
    },

    // WORKFLOW STATUS
    status: {
      type: String,
      enum: [
        "REGISTERED",
        "AI_EVALUATED",
        "ELIGIBLE",
        "BLOCKED",
        "MANUAL_REVIEW",
        "NGO_APPROVED",
        "NGO_REJECTED",
        "ACTIVE",
      ],
      default: "REGISTERED",
      index: true,
    },

    // AI DECISION SYSTEM
    aiDecision: {
      eligibilityConfidence: {
        type: Number,
        default: null,
      },

      fraudRisk: {
        type: Number,
        default: null,
      },

      decision: {
        type: String,
        enum: [
          "ALLOW",
          "ALLOW_WITH_MONITORING",
          "MANUAL_REVIEW",
          "BLOCK",
        ],
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

      evaluatedAt: {
        type: Date,
        default: null,
      },
    },

    // NGO OVERRIDE SYSTEM
    overrideByNgo: {
      decision: {
        type: String,
        enum: ["APPROVED", "REJECTED"],
        default: null,
      },

      reason: {
        type: String,
        default: null,
      },

      ngo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      at: {
        type: Date,
        default: null,
      },
    },

    // FRAUD MONITORING
    fraudFlags: {
      type: [String],
      default: [],
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // REGISTRATION SOURCE
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    registrationSource: {
      type: String,
      enum: ["NGO", "SELF", "GOVERNMENT", "SYSTEM"],
      default: "NGO",
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
  { timestamps: true }
);

// INDEXES
beneficiarySchema.index(
  { aadhaarHash: 1, campaign: 1 },
  { unique: true, sparse: true }
);

beneficiarySchema.index({ campaign: 1, status: 1 });
beneficiarySchema.index({ riskScore: 1 });
beneficiarySchema.index({ campaign: 1, riskScore: -1 });

export const Beneficiary = mongoose.model(
  "Beneficiary",
  beneficiarySchema
);