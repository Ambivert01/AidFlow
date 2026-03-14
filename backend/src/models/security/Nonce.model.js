import mongoose from "mongoose";

const nonceSchema = new mongoose.Schema(
  {
    // UNIQUE TOKEN
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // CONTEXT
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
      index: true,
    },

    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      default: null,
    },

    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      default: null,
    },

    // SECURITY TRACKING
    used: {
      type: Boolean,
      default: false,
      index: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    deviceId: {
      type: String,
      default: null,
    },

    // WORKFLOW TRACE
    jobIdHash: {
      type: String,
      default: null,
      index: true,
    },

    // TTL CONTROL
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // auto-delete after 15 minutes
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
  { timestamps: false }
);

// INDEXES
nonceSchema.index({ jti: 1 });
nonceSchema.index({ wallet: 1 });
nonceSchema.index({ used: 1 });

export const Nonce = mongoose.model("Nonce", nonceSchema);