import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { User } from "../src/models/auth/User.model.js";

dotenv.config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@aidflow.com";
  const password = "Admin@123";

  const exists = await User.findOne({ email });

  if (exists) {
    console.log("Admin already exists");

    process.exit();
  }

  const hashed = await bcrypt.hash(password, 12);

  await User.create({
    name: "System Administrator",

    email,

    passwordHash: hashed,

    role: "ADMIN",

    isActive: true,

    verificationStatus: "APPROVED",
  });

  console.log("Admin created successfully");

  process.exit();
}

createAdmin();
