import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

import { User } from "../src/models/auth/User.model.js";
import { Campaign } from "../src/models/ngo/Campaign.model.js";
import { Beneficiary } from "../src/models/beneficiary/Beneficiary.model.js";
import { Merchant } from "../src/models/merchant/Merchant.model.js";
import { Donation } from "../src/models/donor/Donation.model.js";
import { Wallet } from "../src/models/wallet/Wallet.model.js";
import { AuditLog } from "../src/models/audit/AuditLog.model.js";

const USERS = [
  { name: "System Admin",     email: "admin@aidflow.com",       password: "Admin@123",  role: "ADMIN",       verificationStatus: "APPROVED" },
  { name: "Public Official",  email: "govt@aidflow.com",        password: "Admin@123",  role: "GOVERNMENT",  verificationStatus: "APPROVED" },
  { name: "Relief NGO",       email: "ngo@aidflow.com",         password: "Admin@123",  role: "NGO",         verificationStatus: "APPROVED" },
  { name: "Generous Donor",   email: "donor@aidflow.com",       password: "Admin@123",  role: "DONOR",       verificationStatus: "APPROVED" },
  { name: "John Beneficiary", email: "beneficiary@aidflow.com", password: "Admin@123",  role: "BENEFICIARY", verificationStatus: "APPROVED" },
  { name: "QuickMart Store",  email: "merchant@aidflow.com",    password: "Admin@123",  role: "MERCHANT",    verificationStatus: "APPROVED" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear
    await Promise.all([
      AuditLog.deleteMany({}), Wallet.deleteMany({}), Donation.deleteMany({}),
      Beneficiary.deleteMany({}), Campaign.deleteMany({}), Merchant.deleteMany({}), User.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Create users
    const created = {};
    for (const u of USERS) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      const user = await User.create({ ...u, passwordHash, isActive: true });
      created[u.role] = user;
      console.log(`Created ${u.role}: ${u.email}`);
    }

    // Create Merchant profile
    const merchant = await Merchant.create({
      user: created.MERCHANT._id,
      shopName: "QuickMart Essentials",
      category: "FOOD",
      location: { ward: "Ward 12", district: "Central", state: "Relief State", lat: 12.9716, lng: 77.5946 },
      status: "ACTIVE",
      approvedBy: created.ADMIN._id,
      approvedAt: new Date(),
    });
    console.log("Created Merchant profile");

    // Create Campaign
    const campaign = await Campaign.create({
      title: "Flood Relief Ward 12",
      description: "Emergency relief for Ward 12 flood-affected families. Providing food, medicine and shelter supplies.",
      disasterType: "FLOOD",
      targetAmount: 500000,
      location: { ward: "Ward 12", district: "Central", state: "Relief State", lat: 12.9716, lng: 77.5946 },
      createdBy: created.NGO._id,
      approvedBy: created.ADMIN._id,
      status: "ACTIVE",
      jobIdHash: `campaign_seed_${Date.now()}`,
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

    // Create Beneficiary
    const beneficiary = await Beneficiary.create({
      user: created.BENEFICIARY._id,
      campaign: campaign._id,
      name: "John Beneficiary",
      phone: "9999999999",
      location: { ward: "Ward 12", district: "Central", state: "Relief State", lat: 12.9716, lng: 77.5946 },
      household: { familySize: 4, dependents: 2 },
      vulnerabilityScore: 70,
      displacementStatus: "DISPLACED",
      status: "ACTIVE",
      registeredBy: created.NGO._id,
    });
    console.log(`Created Beneficiary: ${beneficiary._id}`);

    // Create Wallet for beneficiary
    const wallet = await Wallet.create({
      beneficiary: beneficiary._id,
      campaign: campaign._id,
      balance: 5000,
      initialAmount: 5000,
      jobIdHash: `wallet_seed_${Date.now()}`,
      policy: {
        allowedCategories: ["FOOD", "MEDICINE"],
        maxPerTransaction: 1000,
        dailyLimit: 2000,
        expiresAt: new Date(Date.now() + 14 * 86400000),
      },
      status: "ACTIVE",
    });
    console.log(`Created Wallet: ${wallet._id}`);

    console.log("\n✅ Seed complete!");
    console.log("\nLogin credentials (all use password: Admin@123):");
    USERS.forEach(u => console.log(`  ${u.role.padEnd(12)} → ${u.email}`));

    process.exit(0);
  } catch (err) {
    console.error("SEED ERROR:", err);
    process.exit(1);
  }
}

seed();
