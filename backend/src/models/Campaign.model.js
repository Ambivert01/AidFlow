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
      enum: ["FLOOD", "EARTHQUAKE", "CYCLONE", "FIRE", "OTHER"],
      required: true,
    },

    location: {
      state: String,
      district: String,
      ward: String,
      geoHash: String,
    },

    // NGO accountability
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // IMMUTABLE POLICY SNAPSHOT
    policySnapshot: {
      type: Object,
      required: true,
    },

    // WORKFLOW TRACE ID (CRITICAL)
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
        "COMPLETED",
        "ARCHIVED",
      ],
      default: "DRAFT",
      index: true,
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);