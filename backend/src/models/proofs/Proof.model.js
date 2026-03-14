import mongoose from "mongoose";

const proofFileSchema = new mongoose.Schema(
  {
    fileUrl: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      enum: ["IMAGE", "VIDEO", "PDF", "DOCUMENT"],
      required: true,
    },

    mimeType: {
      type: String,
      default: null,
    },

    size: {
      type: Number,
      default: null,
    },

    checksum: {
      type: String,
      default: null,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { _id: false }
);

const proofSchema = new mongoose.Schema(
  {
    // CORE REFERENCES
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
      index: true,
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MerchantTransaction",
      default: null,
      index: true,
    },

    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      default: null,
    },

    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      default: null,
    },

    // PROOF TYPE
    proofType: {
      type: String,
      enum: [
        "PURCHASE_RECEIPT",
        "AID_DELIVERY",
        "BENEFICIARY_CONFIRMATION",
        "MERCHANT_INVOICE",
        "FIELD_REPORT",
        "OTHER",
      ],
      required: true,
      index: true,
    },

    // FILES
    files: {
      type: [proofFileSchema],
      default: [],
    },

    // GEO VERIFICATION
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      geoHash: { type: String, default: null },
    },

    capturedAt: {
      type: Date,
      default: Date.now,
    },

    // AI VALIDATION
    aiValidation: {
      verified: {
        type: Boolean,
        default: false,
      },

      confidenceScore: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },

      fraudProbability: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },

      flags: {
        type: [String],
        default: [],
      },

      evaluatedAt: {
        type: Date,
        default: null,
      },
    },

    // HUMAN VERIFICATION
    manualReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      decision: {
        type: String,
        enum: ["APPROVED", "REJECTED", null],
        default: null,
      },

      reason: {
        type: String,
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },
    },

    // STATUS
    status: {
      type: String,
      enum: [
        "UPLOADED",
        "AI_VERIFIED",
        "FLAGGED",
        "MANUAL_REVIEW",
        "APPROVED",
        "REJECTED",
      ],
      default: "UPLOADED",
      index: true,
    },

    // AUDIT LINK
    auditLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditLog",
      default: null,
    },

    hash: {
      type: String,
      default: null,
      index: true,
    },

    // SYSTEM METADATA
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
proofSchema.index({ campaign: 1, proofType: 1 });
proofSchema.index({ beneficiary: 1 });
proofSchema.index({ merchant: 1 });
proofSchema.index({ status: 1 });

export const Proof = mongoose.model("Proof", proofSchema);