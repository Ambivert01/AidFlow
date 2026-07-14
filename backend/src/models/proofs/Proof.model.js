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

    // Perceptual hash (imagehash.phash), distinct from `checksum` (SHA-256).
    // checksum is for tamper-evidence (exact byte match only); this is for
    // similarity-based duplicate detection (tolerant of recompression/resize)
    // and is written by the proof AI agent after validation, not by the
    // upload endpoint.
    perceptualHash: {
      type: String,
      default: null,
      index: true,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { _id: false },
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
        "UNDER_VALIDATION",
        "AI_VERIFIED",
        "FLAGGED",
        "MANUAL_REVIEW",
        "APPROVED",
        "REJECTED",
      ],
      default: "UPLOADED",
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

    blockchainTxHash: {
      type: String,
      default: null,
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
  { timestamps: true },
);

// INDEXES
proofSchema.index({ campaign: 1, proofType: 1 });
proofSchema.index({ beneficiary: 1 });
proofSchema.index({ merchant: 1 });
proofSchema.index({ status: 1 });
proofSchema.index({ campaign: 1, status: 1 }); // For campaign proof queries
proofSchema.index({ "files.checksum": 1 }); // For duplicate detection
proofSchema.index({ status: 1, createdAt: -1 }); // For admin review queue
proofSchema.index({ "aiValidation.evaluatedAt": 1 }); // For AI validation tracking
proofSchema.index({ campaign: 1, status: 1, capturedAt: -1 }); // For donor timeline

export const Proof = mongoose.model("Proof", proofSchema);
