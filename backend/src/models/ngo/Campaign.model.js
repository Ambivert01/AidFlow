import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    // BASIC CAMPAIGN INFORMATION
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    disasterType: {
      type: String,
      enum: [
        "FLOOD",
        "EARTHQUAKE",
        "CYCLONE",
        "FIRE",
        "DROUGHT",
        "PANDEMIC",
        "WAR",
        "OTHER",
      ],
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    // LOCATION
    location: {
      state: { type: String, default: null },
      district: { type: String, default: null },
      ward: { type: String, default: null },
      geoHash: { type: String, default: null },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // OWNERSHIP
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // WORKFLOW TRACE
    jobIdHash: {
      type: String,
      required: true,
      unique: true,
    },

    // POLICY SNAPSHOT
    // immutable rules copied into wallets
    policySnapshot: {
      allowedCategories: {
        type: [String],
        enum: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"],
        default: ["FOOD", "MEDICINE", "SHELTER"],
      },

      maxPerBeneficiary: {
        type: Number,
        default: 5000,
      },

      maxPerTransaction: {
        type: Number,
        default: 1000,
      },

      validityDays: {
        type: Number,
        default: 14,
      },

      cooldownDays: {
        type: Number,
        default: 7,
      },

      minEligibilityConfidence: {
        type: Number,
        default: 0.6,
      },

      maxFraudRisk: {
        type: Number,
        default: 0.4,
      },
    },

    // FUNDING METRICS
    totalDonated: {
      type: Number,
      default: 0,
    },

    totalAllocated: {
      type: Number,
      default: 0,
    },

    totalSpent: {
      type: Number,
      default: 0,
    },

    // BENEFICIARY METRICS
    totalBeneficiaries: {
      type: Number,
      default: 0,
    },

    totalWalletsCreated: {
      type: Number,
      default: 0,
    },

    beneficiariesServed: {
      type: Number,
      default: 0,
    },

    // TRANSPARENCY METRICS
    transparencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    proofCount: {
      type: Number,
      default: 0,
    },

    proofVerifiedCount: {
      type: Number,
      default: 0,
    },

    // AI RISK ANALYSIS
    aiRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    aiFlags: {
      type: [String],
      default: [],
    },

    // WORKFLOW STATUS
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "ACTIVE",
        "WORKFLOW_RUNNING",
        "PAUSED",
        "COMPLETED",
        "CLOSED",
        "ARCHIVED",
        "AUDIT_FINALIZED",
      ],
      default: "DRAFT",
      index: true,
    },

    pausedReason: {
      type: String,
      default: null,
    },

    closedReason: {
      type: String,
      default: null,
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // TIME WINDOWS
    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: null,
    },

    // FUTURE EXTENSIONS
    governance: {
      allowDAOReview: { type: Boolean, default: false },
      allowPublicAudit: { type: Boolean, default: true },
    },

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
campaignSchema.index({ createdBy: 1, status: 1 });
campaignSchema.index({ disasterType: 1 });

export const Campaign = mongoose.model("Campaign", campaignSchema);
