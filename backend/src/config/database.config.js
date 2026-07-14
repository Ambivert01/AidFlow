import mongoose from "mongoose";
import { env } from "./env.config.js";

export const connectDB = async () => {
  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
};
