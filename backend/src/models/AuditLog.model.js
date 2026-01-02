import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // eventType - searchable
    eventType: {
      type: String,
      required: true,
      index: true,
    },

    entityId: {
      type: String,
      required: true,
    },

    // payload - action context (no PII)
    payload: {
      type: Object,
      required: true,
    },

    // previousHash - links events (block-like)
    previousHash: {
      type: String,
      default: null,
    },

    // hash - detects tampering
    hash: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
