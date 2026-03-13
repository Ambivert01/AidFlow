import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    disasterType: {
      type: String,
      enum: ["FLOOD", "EARTHQUAKE", "CYCLONE", "FIRE", "DROUGHT", "PANDEMIC", "OTHER"],
      required: true,
    },

    location: {
      state: { type: String, default: null },
      district: { type: String, default: null },
      ward: { type: String, default: null },
      geoHash: { type: String, default: null },
    },

    // NGO accountability
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // IMMUTABLE POLICY SNAPSHOT — locked at activation
    policySnapshot: {
      allowedCategories: { type: [String], default: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"] },
      maxPerBeneficiary: { type: Number, default: 5000 },
      validityDays: { type: Number, default: 14 },
      cooldownDays: { type: Number, default: 7 },
      minEligibilityConfidence: { type: Number, default: 0.6 },
      maxFraudRisk: { type: Number, default: 0.4 },
      maxPerTransaction: { type: Number, default: 1000 },
    },

    // WORKFLOW TRACE ID — same across entire campaign audit chain
    jobIdHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Workflow lifecycle
    status: {
      type: String,
      enum: [
        "DRAFT",
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

    // Aggregate stats (updated on events)
    totalDonated: { type: Number, default: 0 },
    totalBeneficiaries: { type: Number, default: 0 },
    totalWalletsCreated: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },

    pausedReason: { type: String, default: null },
    closedReason: { type: String, default: null },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);