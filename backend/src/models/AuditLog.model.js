import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // 🔹 Type of event (DONATION_CREATED, FUNDS_RELEASED, etc.)
    eventType: {
      type: String,
      required: true,
      index: true,
    },

    // 🔹 Entity involved (donationId, beneficiaryId, etc.)
    entityId: {
      type: String,
      required: true,
      index: true,
    },

    // 🔹 AidFlow workflow trace (same for entire flow)
    jobIdHash: {
      type: String,
      required: true,
      index: true,
    },

    // 🔹 Disaster / campaign linkage
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    // 🔹 Who triggered this (DONOR / NGO / SYSTEM / AI)
    actorRole: {
      type: String,
      enum: ["DONOR", "NGO", "BENEFICIARY", "MERCHANT", "GOVERNMENT", "SYSTEM", "AI"],
      required: true,
    },

    // 🔹 Context data (NO PII)
    payload: {
      type: Object,
      required: true,
    },

    // 🔹 Blockchain-like chaining (already good)
    previousHash: {
      type: String,
      default: null,
    },

    // 🔹 Tamper-proof hash
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 🔹 On-chain proof (optional but powerful)
    blockchainTxHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
