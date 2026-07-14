import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Used by wallet operations (legacy pattern)
    operation: {
      type: String,
      enum: [
        "WALLET_CREATE",
        "WALLET_SPEND",
        "WALLET_CREDIT",
        "WALLET_ADJUST",
      ],
    },

    // Used by generic resource creation (proofs, donations, etc.)
    resourceType: {
      type: String,
      enum: ["Proof", "Donation", "Wallet", "Settlement"],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
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
    },
  },
  { timestamps: true },
);

// TTL INDEX FOR AUTO-DELETION
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Composite lookup index for resource-based idempotency checks
idempotencyKeySchema.index({ key: 1, resourceType: 1 });

export const IdempotencyKey = mongoose.model(
  "IdempotencyKey",
  idempotencyKeySchema,
);
