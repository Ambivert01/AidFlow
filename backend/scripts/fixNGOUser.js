import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { User } from "../src/models/auth/User.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aidflow";

async function fixNGOUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await User.updateOne(
      { email: "ngoo@gmail.com" },
      { 
        $set: { 
          emailVerified: true,
          isActive: true,
          verificationStatus: "APPROVED"
        } 
      }
    );
    
    console.log(`✅ Updated NGO user: ${result.modifiedCount} document(s) modified`);
    
    const ngo = await User.findOne({ email: "ngoo@gmail.com" });
    console.log("\n📋 NGO User Status:");
    console.log(`   Email: ${ngo.email}`);
    console.log(`   Role: ${ngo.role}`);
    console.log(`   Status: ${ngo.verificationStatus}`);
    console.log(`   Active: ${ngo.isActive}`);
    console.log(`   Email Verified: ${ngo.emailVerified}`);
    
    console.log("\n🚀 Ready to login!");
    console.log("   Email: ngoo@gmail.com");
    console.log("   Password: ngoo@gmail.com");

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixNGOUser();
