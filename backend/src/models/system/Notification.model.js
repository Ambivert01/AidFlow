import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // RECIPIENT
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: [
        "DONOR",
        "NGO",
        "BENEFICIARY",
        "MERCHANT",
        "ADMIN",
        "GOVERNMENT",
        "SYSTEM"
      ],
      required: true,
      index: true,
    },

    // NOTIFICATION TYPE
    type: {
      type: String,
      enum: [
        // Donation
        "DONATION_SUCCESS",
        "DONATION_REJECTED",
        "DONATION_ESCALATED",

        // Campaign
        "CAMPAIGN_CREATED",
        "CAMPAIGN_APPROVED",
        "CAMPAIGN_REJECTED",
        "CAMPAIGN_PAUSED",
        "CAMPAIGN_RESUMED",
        "CAMPAIGN_COMPLETED",

        // Beneficiary
        "BENEFICIARY_APPROVED",
        "BENEFICIARY_REJECTED",
        "BENEFICIARY_APPEAL_DECIDED",
        "BENEFICIARY_BLOCKED",

        // Wallet
        "WALLET_CREATED",
        "WALLET_CREDITED",
        "WALLET_ADJUSTED",
        "WALLET_CLOSED",
        "WALLET_FROZEN",
        "WALLET_EXPIRED",
        "LOW_BALANCE",

        // Proof
        "PROOF_VERIFIED",
        "PROOF_REJECTED",

        // Merchant / Transactions
        "TRANSACTION_SUCCESS",
        "MERCHANT_SETTLEMENT",

        // Security / Governance
        "FRAUD_ALERT",
        "GOVERNMENT_ESCALATION",
        "SYSTEM_ALERT",

        "OTHER"
      ],
      required: true,
      index: true,
    },

    // CONTENT
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // LINKED ENTITY
    entityType: {
      type: String,
      enum: [
        "Donation",
        "Campaign",
        "Beneficiary",
        "Wallet",
        "Merchant",
        "FraudAlert",
        "Settlement"
      ],
      default: null,
    },

    entityId: {
      type: String,
      default: null,
    },

    // DELIVERY CHANNEL
    channels: {
      type: [String],
      enum: ["IN_APP", "EMAIL", "SMS", "PUSH"],
      default: ["IN_APP"],
    },

    // PRIORITY
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
      default: "NORMAL",
      index: true,
    },

    // DELIVERY STATUS
    deliveryStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },

    sentAt: {
      type: Date,
      default: null,
    },

    // READ STATUS
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
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
    }
  },
  { timestamps: true }
);

// INDEXES
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1, priority: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);