import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../models/User.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { Beneficiary } from "../models/Beneficiary.model.js";
import { Merchant } from "../models/Merchant.model.js";
import { Donation } from "../models/Donation.model.js";
import { Wallet } from "../models/Wallet.model.js";
import { AuditLog } from "../models/AuditLog.model.js";
import { Nonce } from "../models/Nonce.model.js";
import { config } from "../src/config/env.js";

dotenv.config();

const users = [
  {
    name: "System Admin",
    email: "admin@aidflow.com",
    password: "password123",
    role: "ADMIN",
    verificationStatus: "APPROVED",
  },
  {
    name: "Public Official",
    email: "govt@aidflow.com",
    password: "password123",
    role: "GOVERNMENT",
    verificationStatus: "APPROVED",
  },
  {
    name: "Relief NGO",
    email: "ngo@aidflow.com",
    password: "password123",
    role: "NGO",
    verificationStatus: "APPROVED",
  },
  {
    name: "Generous Donor",
    email: "donor@aidflow.com",
    password: "password123",
    role: "DONOR",
    verificationStatus: "APPROVED",
  },
  {
    name: "John Beneficiary",
    email: "beneficiary@aidflow.com",
    password: "password123",
    role: "BENEFICIARY",
    verificationStatus: "APPROVED",
    location: "Ward 12, Flood Zone A",
  },
  {
    name: "QuickMart Merchant",
    email: "merchant@aidflow.com",
    password: "password123",
    role: "MERCHANT",
    verificationStatus: "APPROVED",
    merchantProfile: {
      shopName: "QuickMart Essentials",
      category: "FOOD",
      location: {
        ward: "Ward 12",
        district: "Central",
        state: "Relief State",
      },
      status: "ACTIVE",
    },
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongoUri || process.env.MONGO_URI);
    console.log("Connected.");

    console.log("Clearing existing data...");
    await Promise.all([
      AuditLog.deleteMany({}),
      Nonce.deleteMany({}),
      Wallet.deleteMany({}),
      Donation.deleteMany({}),
      Beneficiary.deleteMany({}),
      Campaign.deleteMany({}),
      Merchant.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("Cleared.");

    const createdUsers = {};
    for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 12);
      const user = await User.create({
        ...u,
        password: hashedPassword,
      });
      console.log(`Created ${u.role}: ${u.email}`);
      createdUsers[u.role] = user;
    }

    // Create Merchant record (wallet engine uses Merchant collection)
    if (createdUsers.MERCHANT) {
      await Merchant.create({
        user: createdUsers.MERCHANT._id,
        shopName: createdUsers.MERCHANT.merchantProfile?.shopName || "QuickMart Essentials",
        category: createdUsers.MERCHANT.merchantProfile?.category || "FOOD",
        location: createdUsers.MERCHANT.merchantProfile?.location || {
          ward: "Ward 12",
          district: "Central",
          state: "Relief State",
        },
        status: "ACTIVE",
      });
      console.log("Created Merchant profile record");
    }

    // Create an ACTIVE campaign owned by NGO (required for donations)
    const campaign = await Campaign.create({
      title: "Flood Relief Ward 12",
      description: "Emergency relief for Ward 12 flood-affected families.",
      disasterType: "FLOOD",
      location: { ward: "Ward 12", district: "Central", state: "Relief State" },
      createdBy: createdUsers.NGO._id,
      status: "ACTIVE",
      jobIdHash: `campaign_${Date.now()}`,
      policySnapshot: {
        allowedCategories: ["FOOD", "MEDICINE"],
        maxPerBeneficiary: 5000,
        maxPerTransaction: 1000,
        validityDays: 14,
        minEligibilityConfidence: 0.6,
        maxFraudRisk: 0.4,
      },
    });
    console.log(`Created Campaign: ${campaign._id}`);

    // Create an ACTIVE beneficiary record tied to the beneficiary user (required for NGO assignment)
    const beneficiary = await Beneficiary.create({
      user: createdUsers.BENEFICIARY._id,
      campaign: campaign._id,
      name: createdUsers.BENEFICIARY.name,
      phone: "9999999999",
      location: { ward: "Ward 12", district: "Central", state: "Relief State" },
      familySize: 4,
      vulnerabilityScore: 70,
      status: "ACTIVE",
    });
    console.log(`Created Beneficiary: ${beneficiary._id}`);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("SEED ERROR:", err);
    process.exit(1);
  }
}

seed();
