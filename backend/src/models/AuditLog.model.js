import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // Type of event
    eventType: {
      type: String,
      required: true,
      index: true,
    },

    // Entity involved (donationId, beneficiaryId, etc.)
    entityId: {
      type: String,
      required: true,
      index: true,
    },

    // AidFlow workflow trace (same for entire flow)
    jobIdHash: {
      type: String,
      required: true,
      index: true,
    },

    // Campaign linkage
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: false,
      default: null,
    },

    // Incremental sequence to ensure strictly linear chain per job
    sequence: {
      type: Number,
      required: true,
      default: 0,
    },

    // Who triggered this
    actorRole: {
      type: String,
      enum: ["DONOR", "NGO", "BENEFICIARY", "MERCHANT", "GOVERNMENT", "SYSTEM", "AI", "ADMIN"],
      required: true,
    },

    // Context data (NO PII)
    payload: {
      type: Object,
      required: true,
    },

    // Blockchain-like chaining
    previousHash: {
      type: String,
      default: null,
    },

    // Tamper-proof hash of this log entry
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Merkle root after workflow finalization
    merkleRoot: {
      type: String,
      default: null,
    },

    // When this workflow was finalized
    finalizedAt: {
      type: Date,
      default: null,
    },

    // On-chain proof reference
    blockchainTxHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
