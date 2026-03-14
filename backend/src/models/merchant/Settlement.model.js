import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    // MERCHANT LINK
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true,
    },

    // SETTLEMENT BATCH
    batchId: {
      type: String,
      required: true,
      index: true,
    },

    settlementReference: {
      type: String,
      default: null,
      index: true,
    },

    // FINANCIAL DETAILS
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    transactionCount: {
      type: Number,
      default: 0,
    },

    // TRANSACTION LINKS
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
      },
    ],

    // PAYMENT DETAILS
    paymentMethod: {
      type: String,
      enum: [
        "BANK_TRANSFER",
        "UPI",
        "PAYMENT_GATEWAY",
        "CRYPTO",
      ],
      default: "BANK_TRANSFER",
    },

    paymentProvider: {
      type: String,
      default: null,
    },

    bankReference: {
      type: String,
      default: null,
      index: true,
    },

    // STATUS
    status: {
      type: String,
      enum: [
        "CREATED",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      default: "CREATED",
      index: true,
    },

    failureReason: {
      type: String,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    // RECONCILIATION
    reconciliation: {
      reconciled: {
        type: Boolean,
        default: false,
      },

      reconciledAt: {
        type: Date,
        default: null,
      },

      reconciledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
settlementSchema.index({ merchant: 1, status: 1 });
settlementSchema.index({ batchId: 1 });
settlementSchema.index({ bankReference: 1 });

export const Settlement = mongoose.model("Settlement", settlementSchema);