import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT", "ADJUSTMENT"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      enum: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"],
      default: null,
    },

    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      default: null,
    },

    merchantName: {
      type: String,
      default: null,
    },

    reference: {
      type: String,
      default: null,
      index: true,
    },

    balanceAfter: {
      type: Number,
      required: true,
    },

    metadata: {
      type: Object,
      default: {},
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const walletSchema = new mongoose.Schema(
  {
    // CORE REFERENCES
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      required: true,
      index: true,
    },

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      default: null,
    },

    // CREATOR TRACKING
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // WORKFLOW TRACE
    jobIdHash: {
      type: String,
      required: true,
    },

    // BALANCE
    balance: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    initialAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalSpent: {
      type: Number,
      default: 0,
    },

    // WALLET STATUS
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "EXPIRED", "CLOSED"],
      default: "ACTIVE",
    },

    // POLICY SNAPSHOT
    policy: {
      allowedCategories: {
        type: [String],
        enum: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"],
        default: ["FOOD", "MEDICINE", "SHELTER"],
      },

      maxPerTransaction: {
        type: Number,
        default: 1000,
      },

      dailyLimit: {
        type: Number,
        default: 2000,
      },

      weeklyLimit: {
        type: Number,
        default: 5000,
      },

      expiresAt: {
        type: Date,
        default: null,
      },

      // MERCHANT WHITELIST
      allowedMerchants: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Merchant",
        default: [],
      },

      // GEO RESTRICTIONS
      maxDistanceKm: {
        type: Number,
        default: 50,
      },

      allowedDistricts: {
        type: [String],
        default: [],
      },
    },

    // FRAUD MONITORING
    dailySpent: {
      type: Number,
      default: 0,
    },

    weeklySpent: {
      type: Number,
      default: 0,
    },

    transactionCount: {
      type: Number,
      default: 0,
    },

    merchantTransactionCount: {
      type: Number,
      default: 0,
    },

    lastTransactionAt: {
      type: Date,
      default: null,
    },

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    fraudFlags: {
      type: [String],
      default: [],
    },

    // ADMIN ACTIONS - FREEZE
    freezeReason: {
      type: String,
      default: null,
    },

    frozenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    frozenAt: {
      type: Date,
      default: null,
    },

    // ADMIN ACTIONS - CLOSE
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    closeReason: {
      type: String,
      default: null,
    },

    remainingBalanceAtClosure: {
      type: Number,
      default: null,
    },

    // EXPIRY TRACKING
    expiredAt: {
      type: Date,
      default: null,
    },

    // TRANSACTION LEDGER
    transactions: [walletTransactionSchema],

    // SYSTEM FIELDS
    metadata: {
      type: Object,
      default: {},
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

// INDEXES
walletSchema.index({ beneficiary: 1, campaign: 1 }, { unique: true });
walletSchema.index({ status: 1 });
walletSchema.index({ jobIdHash: 1 });
walletSchema.index({ beneficiary: 1, status: 1 });
walletSchema.index({ "policy.expiresAt": 1, status: 1 });
walletSchema.index({ riskScore: -1 });
walletSchema.index({ createdBy: 1 });

export const Wallet = mongoose.model("Wallet", walletSchema);
