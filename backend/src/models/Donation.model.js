import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
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

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // Linked beneficiary after NGO assignment
    beneficiary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      default: null,
    },

    // Full donation lifecycle status
    status: {
      type: String,
      enum: [
        "CREATED",                // Initial state
        "PENDING_NGO_REVIEW",     // Awaiting NGO action
        "NGO_APPROVED",           // NGO approved, move to wallet
        "HIGH_RISK_ESCALATED",    // AI risk > threshold, sent to gov
        "APPROVED_BY_GOVT",       // Government cleared it
        "REJECTED_BY_GOVT",       // Government rejected
        "WALLET_CREATING",        // Wallet creation in progress
        "READY_FOR_USE",          // Wallet active, beneficiary can spend
        "ELIGIBILITY_FAILED",     // AI blocked beneficiary
        "REJECTED",               // NGO rejected
        "REFUNDED",               // Amount refunded
        "AUDIT_FINALIZED",        // Blockchain anchored, workflow closed
      ],
      default: "CREATED",
      index: true,
    },

    reviewReason: { type: String, default: null },

    // AI outputs
    aiDecision: { type: String, default: null },  // ALLOW | MANUAL_REVIEW | BLOCK
    aiRiskScore: { type: Number, default: null },  // 0-100

    // Who acted last
    lastDecisionBy: {
      type: String,
      enum: ["AI", "NGO", "GOVERNMENT", "SYSTEM", "ADMIN"],
      default: "SYSTEM",
    },

    decisionReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const Donation = mongoose.model("Donation", donationSchema);
