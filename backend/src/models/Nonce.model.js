import mongoose from "mongoose";

const nonceSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // TTL index: auto-delete after 15 minutes (QR expires in 10)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, 
    },
  }
);

export const Nonce = mongoose.model("Nonce", nonceSchema);
