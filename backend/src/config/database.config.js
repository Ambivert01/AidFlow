import mongoose from "mongoose";
import { env } from "./env.config.js";

export const connectDB = async () => {

  await mongoose.connect(env.MONGO_URI);

  console.log("MongoDB connected");

};