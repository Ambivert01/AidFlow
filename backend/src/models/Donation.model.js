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

    status: {
      type: String,
      enum: ["RECEIVED", "LOCKED", "DISTRIBUTED"],
      // RECEIVED - donation arrived
      // LOCKED - wallet engine reserved funds
      // DISTRIBUTED - funds spent (later phase)
      // No mutation of amount allowed.
      default: "RECEIVED",
    },
  },
  { timestamps: true }
);

export const Donation = mongoose.model("Donation", donationSchema);
