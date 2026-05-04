import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      index: true,
    },

    entityId: {
      type: String,
      required: true,
      index: true,
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"],
      default: "OPEN",
      index: true,
    },

    // Investigation assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Resolution details
    resolution: {
      decision: {
        type: String,
        enum: ["CONFIRMED_FRAUD", "FALSE_POSITIVE", "DISMISSED", null],
        default: null,
      },
      notes: {
        type: String,
        default: null,
      },
      actionTaken: {
        type: String,
        default: null,
      },
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    // AI detection metadata
    aiMetadata: {
      modelVersion: String,
      confidence: Number,
      signals: [String],
    },

    // Related entities
    relatedCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },

    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Investigation notes
    notes: [
      {
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// Indexes
schema.index({ status: 1, createdAt: -1 });
schema.index({ entityType: 1, entityId: 1 });

export const FraudCase = mongoose.model("FraudCase", schema);
