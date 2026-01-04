import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    categoryLimits: {
      food: { type: Number, default: 0 },
      medicine: { type: Number, default: 0 },
      shelter: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "FROZEN"],
      default: "ACTIVE",
    },

    transactions: [
      {
        type: {
          type: String,
          enum: ["CREDIT", "DEBIT"],
        },
        amount: Number,
        category: String,
        reference: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
