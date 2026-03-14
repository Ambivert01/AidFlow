import mongoose from "mongoose";

const fraudAlertSchema = new mongoose.Schema(
  {
    // ALERT IDENTIFICATION
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ENTITY TARGET
    entityType: {
      type: String,
      enum: [
        "USER",
        "DONATION",
        "CAMPAIGN",
        "BENEFICIARY",
        "WALLET",
        "MERCHANT",
        "TRANSACTION",
        "PROOF",
      ],
      required: true,
      index: true,
    },

    entityId: {
      type: String,
      required: true,
      index: true,
    },

    // CAMPAIGN CONTEXT
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true,
    },

    // ALERT TYPE
    alertType: {
      type: String,
      enum: [
        "DUPLICATE_BENEFICIARY",
        "SUSPICIOUS_TRANSACTION",
        "MERCHANT_COLLUSION",
        "PROOF_MANIPULATION",
        "WALLET_ABUSE",
        "DONATION_LAUNDERING",
        "AI_ANOMALY",
        "GEO_VIOLATION",
        "OTHER",
      ],
      required: true,
      index: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },

    // AI DETECTION DATA
    aiDetection: {
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      modelVersion: {
        type: String,
        default: null,
      },

      anomalyType: {
        type: String,
        default: null,
      },

      signals: {
        type: [String],
        default: [],
      },
    },

    // ALERT STATUS
    status: {
      type: String,
      enum: [
        "OPEN",
        "UNDER_INVESTIGATION",
        "CONFIRMED_FRAUD",
        "FALSE_POSITIVE",
        "RESOLVED",
      ],
      default: "OPEN",
      index: true,
    },

    // AUTOMATED ACTIONS
    automatedActions: {
      walletFrozen: {
        type: Boolean,
        default: false,
      },

      merchantSuspended: {
        type: Boolean,
        default: false,
      },

      beneficiaryBlocked: {
        type: Boolean,
        default: false,
      },
    },

    // INVESTIGATION
    investigation: {
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      notes: {
        type: String,
        default: null,
      },

      decision: {
        type: String,
        enum: ["CONFIRMED", "DISMISSED", null],
        default: null,
      },

      resolvedAt: {
        type: Date,
        default: null,
      },
    },

    // AUDIT LINK
    auditLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditLog",
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
  { timestamps: true }
);

// INDEXES
fraudAlertSchema.index({ entityType: 1, entityId: 1 });
fraudAlertSchema.index({ status: 1, severity: 1 });
fraudAlertSchema.index({ campaign: 1 });

export const FraudAlert = mongoose.model("FraudAlert", fraudAlertSchema);