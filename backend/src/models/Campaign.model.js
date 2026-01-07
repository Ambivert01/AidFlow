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
    },

    // ensures rules cannot change mid-execution
    policySnapshot: {
      type: Object, // rules frozen at campaign creation
      required: true,
    },

    // workflow engine will later act on this
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "WORKFLOW_RUNNING", "COMPLETED", "ARCHIVED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);
