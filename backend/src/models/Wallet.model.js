import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema(
  {
    // Owner — one wallet per beneficiary per campaign
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      required: true,
      index: true,
    },

    // Campaign linkage (critical for audit + policy enforcement)
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    // Workflow trace (same as donation.jobIdHash)
    jobIdHash: {
      type: String,
      index: true,
      default: null,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN", "EXPIRED", "CLOSED"],
      default: "ACTIVE",
      index: true,
    },

    // Spending policy (copied from campaign.policySnapshot at creation)
    policy: {
      allowedCategories: { type: [String], default: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"] },
      maxPerTransaction: { type: Number, default: 1000 },
      expiresAt: { type: Date, default: null },
    },

    // Fraud monitoring fields
    dailySpent: { type: Number, default: 0 },
    weeklySpent: { type: Number, default: 0 },
    lastTransactionAt: { type: Date, default: null },
    merchantTransactionCount: { type: Number, default: 0 },

    freezeReason: { type: String, default: null },
    frozenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    transactions: [
      {
        type: {
          type: String,
          enum: ["CREDIT", "DEBIT"],
          required: true,
        },
        amount: { type: Number, required: true },
        category: { type: String, default: null },
        merchantId: { type: String, default: null },
        merchantName: { type: String, default: null },
        reference: { type: String, default: null },
        balanceAfter: { type: Number, required: true },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate wallet for same beneficiary+campaign
WalletSchema.index({ beneficiary: 1, campaign: 1 }, { unique: true });

export const Wallet = mongoose.model("Wallet", WalletSchema);
