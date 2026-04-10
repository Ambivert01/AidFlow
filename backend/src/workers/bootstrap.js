import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export async function connectWorkerDB() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(process.env.MONGO_URI);

  console.log("Worker MongoDB connected");
}
