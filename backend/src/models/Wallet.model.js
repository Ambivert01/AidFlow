import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    balance: {
      type: Number,
      required: true,
      min: 0,
    },

    // IMMUTABLE POLICY SNAPSHOT
    policy: {
      allowedCategories: {
        type: [String],
        required: true,
      },
      maxPerTransaction: {
        type: Number,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "FROZEN", "CLOSED"],
      default: "ACTIVE",
    },

    jobIdHash: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
