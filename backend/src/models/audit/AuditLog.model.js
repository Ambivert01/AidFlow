import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // EVENT IDENTIFICATION
    eventType: {
      type: String,
      required: true,
      index: true,
    },

    eventCategory: {
      type: String,
      enum: [
        "AUTH",
        "DONATION",
        "CAMPAIGN",
        "BENEFICIARY",
        "WALLET",
        "TRANSACTION",
        "PROOF",
        "MERCHANT",
        "SYSTEM",
        "SECURITY",
      ],
      required: true,
      index: true,
    },

    // ENTITY REFERENCE
    entityId: {
      type: String,
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      enum: [
        "Donation",
        "Campaign",
        "Beneficiary",
        "Wallet",
        "Merchant",
        "User",
        "Proof",
      ],
      required: true,
      index: true,
    },

    // WORKFLOW TRACE
    jobIdHash: {
      type: String,
      required: true,
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true,
    },

    sequence: {
      type: Number,
      required: true,
      index: true,
    },

    workflowStage: {
      type: String,
      default: null,
    },

    // ACTOR INFORMATION
    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      role: {
        type: String,
        enum: [
          "DONOR",
          "NGO",
          "BENEFICIARY",
          "MERCHANT",
          "GOVERNMENT",
          "SYSTEM",
          "AI",
          "ADMIN",
        ],
        required: true,
      },

      ipAddress: {
        type: String,
        default: null,
      },

      deviceId: {
        type: String,
        default: null,
      },
    },

    // EVENT PAYLOAD
    payload: {
      type: Object,
      required: true,
    },

    // AI / AUTOMATION FLAGS
    aiMetadata: {
      decision: { type: String, default: null },
      riskScore: { type: Number, default: null },
      flags: { type: [String], default: [] },
    },

    // HASH CHAIN
    previousHash: {
      type: String,
      default: null,
    },

    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // MERKLE TREE DATA
    merkleRoot: {
      type: String,
      default: null,
    },

    merkleIndex: {
      type: Number,
      default: null,
    },

    finalizedAt: {
      type: Date,
      default: null,
    },

    // BLOCKCHAIN ANCHOR
    blockchainAnchor: {
      chain: {
        type: String,
        enum: ["ETHEREUM", "POLYGON", "SOLANA", "OTHER"],
        default: null,
      },

      txHash: {
        type: String,
        default: null,
      },

      blockNumber: {
        type: Number,
        default: null,
      },

      anchoredAt: {
        type: Date,
        default: null,
      },
    },

    // FORENSIC FLAGS
    flagged: {
      type: Boolean,
      default: false,
    },

    investigationId: {
      type: String,
      default: null,
    },

    // SYSTEM METADATA
    metadata: {
      type: Object,
      default: {},
    },

    systemVersion: {
      type: String,
      default: "1.0",
    },
  },
  { timestamps: true },
);

// INDEXES
auditLogSchema.index({ jobIdHash: 1, sequence: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ eventCategory: 1, createdAt: -1 });
auditLogSchema.index({ "blockchainAnchor.txHash": 1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
