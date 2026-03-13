import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    // Category must match wallet policy allowedCategories (uppercase)
    category: {
      type: String,
      enum: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"],
      required: true,
    },

    location: {
      ward: { type: String, default: null },
      district: { type: String, default: null },
      state: { type: String, default: null },
      geoFence: { type: String, default: null }, // geo hash for proximity check
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "BANNED"],
      default: "PENDING",
      index: true,
    },

    // Trust / risk scoring
    riskScore: { type: Number, default: 0 },          // 0-100 (higher = riskier)
    transactionCount: { type: Number, default: 0 },
    totalSettled: { type: Number, default: 0 },
    violationCount: { type: Number, default: 0 },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    bannedAt: { type: Date, default: null },
    suspendedReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const Merchant = mongoose.model("Merchant", merchantSchema);
