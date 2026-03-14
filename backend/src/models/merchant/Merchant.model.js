import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
  {
    // USER LINK
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // BASIC PROFILE
    shopName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    businessType: {
      type: String,
      enum: [
        "GROCERY",
        "PHARMACY",
        "SHELTER_SUPPLIES",
        "WATER_SUPPLY",
        "MEDICAL_CENTER",
        "OTHER",
      ],
      default: "OTHER",
    },

    category: {
      type: String,
      enum: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"],
      required: true,
      index: true,
    },

    // LOCATION
    location: {
      address: { type: String, default: null },
      ward: { type: String, default: null },
      district: { type: String, default: null },
      state: { type: String, default: null },

      lat: { type: Number, default: null },
      lng: { type: Number, default: null },

      geoHash: { type: String, default: null },
    },

    // BUSINESS DETAILS
    licenseNumber: {
      type: String,
      default: null,
      index: true,
    },

    gstNumber: {
      type: String,
      default: null,
    },

    documents: {
      type: [String],
      default: [],
    },

    // STATUS
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "BANNED"],
      default: "PENDING",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    suspendedReason: {
      type: String,
      default: null,
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    // TRUST & RISK SCORING
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    fraudFlags: {
      type: [String],
      default: [],
    },

    violationCount: {
      type: Number,
      default: 0,
    },

    // TRANSACTION ANALYTICS
    transactionCount: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },

    totalAidProcessed: {
      type: Number,
      default: 0,
    },

    lastTransactionAt: {
      type: Date,
      default: null,
    },

    // SETTLEMENT SYSTEM
    settlement: {
      pendingBalance: {
        type: Number,
        default: 0,
      },

      totalSettled: {
        type: Number,
        default: 0,
      },

      lastSettlementAt: {
        type: Date,
        default: null,
      },
    },

    // POS / DEVICE INTEGRATION
    posDevices: {
      type: [
        {
          deviceId: String,
          registeredAt: Date,
        },
      ],
      default: [],
    },

    // FUTURE FEATURES
    metadata: {
      type: Object,
      default: {},
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// INDEXES
merchantSchema.index({ category: 1, status: 1 });
merchantSchema.index({ "location.geoHash": 1 });
merchantSchema.index({ trustScore: -1 });

export const Merchant = mongoose.model("Merchant", merchantSchema);