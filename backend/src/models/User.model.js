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
      // select: false - prevents password leakage
    },

    // role - drives entire system authorization
    role: {
      type: String,
      enum: ["ADMIN", "DONOR", "NGO"],
      default: "DONOR",
    },

    // isActive - soft-disable users without deletion
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
