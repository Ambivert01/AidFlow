import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // never auto-return password
    },

    // role - drives entire system authorization
    role: {
      type: String,
      enum: ["ADMIN", "GOVERNMENT", "NGO", "DONOR", "BENEFICIARY", "MERCHANT"],
      required: true,
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "APPROVED", // donors auto-approved; NGO/Merchant start as PENDING
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

    // isActive - soft-disable users without deletion
    isActive: {
      type: Boolean,
      default: true,
    },

    // Merchant profile embedded for quick access
    merchantProfile: {
      shopName: { type: String, default: null },
      category: {
        type: String,
        enum: ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER", null],
        default: null,
      },
      location: {
        ward: { type: String, default: null },
        district: { type: String, default: null },
        state: { type: String, default: null },
      },
      status: {
        type: String,
        enum: ["PENDING", "ACTIVE", "SUSPENDED", null],
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
