// Simple NGO User Creator
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { User } from "../src/models/auth/User.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aidflow";

console.log("🌱 NGO User Creator");
console.log("=".repeat(70));

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function createNGOUser() {
  try {
    await connectDB();

    // Check if NGO user already exists
    let ngo = await User.findOne({ email: "ngoo@gmail.com" });

    if (ngo) {
      console.log("\n✅ NGO user already exists");
      console.log(`   Email: ngoo@gmail.com`);
      console.log(`   Password: ngoo@gmail.com`);
      console.log(`   Role: ${ngo.role}`);
      console.log(`   Status: ${ngo.verificationStatus}`);
    } else {
      console.log("\n👤 Creating NGO user...");
      ngo = await User.create({
        name: "Hope Foundation NGO",
        email: "ngoo@gmail.com",
        passwordHash: await hashPassword("ngoo@gmail.com"),
        role: "NGO",
        verificationStatus: "APPROVED",
        isActive: true,
        emailVerified: true,
        profile: {
          organization: "Hope Foundation",
          registrationNumber: "NGO/2020/12345",
          address: "123 Main Street, Mumbai, Maharashtra",
          phone: "+91-9876543210",
        },
      });
      console.log("✅ NGO user created successfully!");
    }

    console.log("\n🚀 Ready to login!");
    console.log("   Login: http://localhost:3000/login");
    console.log("   Email: ngoo@gmail.com");
    console.log("   Password: ngoo@gmail.com");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

createNGOUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
