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

async function checkNGOUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Need to explicitly select passwordHash since it has select: false
    const ngo = await User.findOne({ email: "ngoo@gmail.com" }).select('+passwordHash');
    
    if (!ngo) {
      console.log("❌ NGO user NOT found!");
    } else {
      console.log("\n✅ NGO user found:");
      console.log(`   Email: ${ngo.email}`);
      console.log(`   Name: ${ngo.name}`);
      console.log(`   Role: ${ngo.role}`);
      console.log(`   Status: ${ngo.verificationStatus}`);
      console.log(`   Active: ${ngo.isActive}`);
      console.log(`   Email Verified: ${ngo.isEmailVerified}`);
      console.log(`   Password Hash exists: ${ngo.passwordHash ? 'YES' : 'NO'}`);
      
      if (ngo.passwordHash) {
        // Test password
        const testPassword = "ngoo@gmail.com";
        const isMatch = await bcrypt.compare(testPassword, ngo.passwordHash);
        console.log(`\n�� Password Test:`);
        console.log(`   Testing password: "${testPassword}"`);
        console.log(`   Match: ${isMatch ? '✅ YES' : '❌ NO'}`);
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkNGOUser();
