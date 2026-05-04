import mongoose from "mongoose";
import { ROLES, VERIFICATION_STATUS } from "../../constants/roles.constants.js";

const userSchema = new mongoose.Schema(
  {
    // BASIC IDENTITY
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    phone: {
      type: String,
      default: null,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // AUTH PROVIDERS
    authProviders: {
      google: { type: String, default: null },
      apple: { type: String, default: null },
      wallet: { type: String, default: null },
    },

    // SYSTEM ROLE
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      index: true,
    },

    // ACCOUNT VERIFICATION
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },

    documents: {
      type: Object,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    // ACCOUNT SECURITY
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    // MFA SUPPORT
    mfaEnabled: {
      type: Boolean,
      default: false,
    },

    mfaSecret: {
      type: String,
      select: false,
      default: null,
    },

    // PROFILE METADATA
    profile: {
      avatar: { type: String, default: null },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
    },

    // AI / RISK FLAGS
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

    // TRUST SCORE (for NGO users)
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      index: true,
    },

    // EMAIL VERIFICATION
    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // PASSWORD RESET
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // SESSION MANAGEMENT (Refresh Tokens)
    sessions: [
      {
        refreshTokenHash: {
          type: String,
          required: true,
        },
        device: {
          type: String,
          default: "Unknown",
        },
        ip: {
          type: String,
          default: null,
        },
        userAgent: {
          type: String,
          default: null,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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
  {
    timestamps: true,
  },
);

// INDEXES
userSchema.index({ role: 1, verificationStatus: 1 });

export const User = mongoose.model("User", userSchema);
