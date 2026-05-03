import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    operation: {
      type: String,
      enum: ["WALLET_CREATE", "WALLET_SPEND", "WALLET_CREDIT", "WALLET_ADJUST"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    result: {
      type: Object,
      default: null,
    },

    error: {
      type: Object,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// TTL INDEX FOR AUTO-DELETION
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey = mongoose.model(
  "IdempotencyKey",
  idempotencyKeySchema,
);
