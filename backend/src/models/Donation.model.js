import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "CREATED", // donor donated
        "ELIGIBILITY_FAILED", // AI or policy rejected
        "PENDING_NGO_REVIEW", // NGO must review
        "REJECTED_BY_NGO",
        "APPROVED_BY_NGO",
        "HIGH_RISK_ESCALATED", // sent to govt
        "REJECTED_BY_GOVT",
        "APPROVED_BY_GOVT",
        "FUNDS_LOCKED",
        "READY_FOR_USE",
        "COMPLETED",
      ],
      default: "CREATED",
      index: true,
    },

    lastDecisionBy: {
      type: String, // AI | NGO | GOVERNMENT | SYSTEM
      default: "SYSTEM",
    },

    decisionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Donation = mongoose.model("Donation", donationSchema);
