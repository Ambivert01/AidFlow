import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../src/models/User.model.js";

dotenv.config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@aidflow.gov";
  const password = "admin123";

  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists");
    process.exit();
  }

  const hashed = await bcrypt.hash(password, 12);

  await User.create({
    name: "System Administrator",
    email,
    password: hashed,
    role: "ADMIN",
    verificationStatus: "APPROVED",
  });

  console.log("Admin created");
  process.exit();
}

createAdmin();
