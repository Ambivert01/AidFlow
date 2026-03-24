import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    // CORE REFERENCES
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    // POLICY SNAPSHOT (immutable at donation time)
    policySnapshot: {
      allowedCategories: [String],
      maxPerBeneficiary: Number,
      maxPerTransaction: Number,
      validityDays: Number,
    },

    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      default: null,
      index: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
    },

    // PAYMENT DETAILS
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING", "CRYPTO", "WALLET", "OTHER"],
      default: "UPI",
    },

    paymentGateway: {
      type: String,
      default: null,
    },

    paymentReference: {
      type: String,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED", "REFUNDED"],
      default: "INITIATED",
    },

    // DONOR OPTIONS
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    donorMessage: {
      type: String,
      default: null,
    },

    // WORKFLOW TRACE
    jobIdHash: {
      type: String,
      required: true,
    },

    idempotencyKey: {
      type: String,
      index: true,
      default: null,
    },

    // DONATION LIFECYCLE STATUS
    status: {
      type: String,
      enum: [
        "CREATED",
        "PAYMENT_PENDING",
        "PAYMENT_SUCCESS",
        "PENDING_NGO_REVIEW",
        "NGO_APPROVED",
        "HIGH_RISK_ESCALATED",
        "APPROVED_BY_GOVT",
        "REJECTED_BY_GOVT",
        "WALLET_CREATING",
        "READY_FOR_USE",
        "ELIGIBILITY_FAILED",
        "REJECTED",
        "REFUNDED",
        "AUDIT_FINALIZED",
      ],
      default: "CREATED",
      index: true,
    },

    reviewReason: {
      type: String,
      default: null,
    },

    // AI DECISION ENGINE
    aiDecision: {
      decision: {
        type: String,
        enum: ["ALLOW", "MANUAL_REVIEW", "BLOCK"],
        default: null,
      },

      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      fraudSignals: {
        type: [String],
        default: [],
      },

      evaluatedAt: {
        type: Date,
        default: null,
      },
    },

    // GOVERNMENT ESCALATION
    governmentReview: {
      escalated: { type: Boolean, default: false },

      decision: {
        type: String,
        enum: ["APPROVED", "REJECTED", null],
        default: null,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      reason: {
        type: String,
        default: null,
      },
    },

    // REFUND HANDLING
    refund: {
      refunded: { type: Boolean, default: false },

      refundAmount: { type: Number, default: 0 },

      refundReference: { type: String, default: null },

      refundedAt: { type: Date, default: null },
    },

    // TRANSPARENCY METRICS
    walletCreated: {
      type: Boolean,
      default: false,
    },

    amountSpent: {
      type: Number,
      default: 0,
    },

    proofVerified: {
      type: Boolean,
      default: false,
    },

    auditFinalized: {
      type: Boolean,
      default: false,
    },

    // FUTURE EXTENSIONS
    governance: {
      allowDAOAudit: { type: Boolean, default: false },
    },

    metadata: {
      type: Object,
      default: {},
    },

    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

// INDEXES
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ campaign: 1, status: 1 });
donationSchema.index({ paymentReference: 1 });
donationSchema.index({ jobIdHash: 1 });
donationSchema.index({ status: 1, createdAt: -1 });

export const Donation = mongoose.model("Donation", donationSchema);
