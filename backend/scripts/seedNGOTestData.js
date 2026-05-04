// Comprehensive NGO System Test Data Seeder - A to Z
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

// Import ALL models
import { User } from "../src/models/auth/User.model.js";
import { Campaign } from "../src/models/ngo/Campaign.model.js";
import { Donation } from "../src/models/donor/Donation.model.js";
import { Beneficiary } from "../src/models/beneficiary/Beneficiary.model.js";
import { Wallet } from "../src/models/wallet/Wallet.model.js";
import { AuditLog } from "../src/models/audit/AuditLog.model.js";
import { TrustLog } from "../src/models/system/TrustLog.model.js";
import { Notification } from "../src/models/system/Notification.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aidflow";

console.log("🌱 COMPREHENSIVE NGO System Test Data Seeder (A-Z)");
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

async function clearNGOTestData(ngoEmail) {
  console.log("\n🧹 Clearing existing NGO test data...");

  const ngo = await User.findOne({ email: ngoEmail });
  if (ngo) {
    // Delete campaigns created by this NGO
    const campaigns = await Campaign.find({ createdBy: ngo._id });
    const campaignIds = campaigns.map((c) => c._id);

    // Delete related data
    await Beneficiary.deleteMany({ registeredBy: ngo._id });
    await Wallet.deleteMany({ createdBy: ngo._id });
    await Donation.deleteMany({ campaign: { $in: campaignIds } });
    await Campaign.deleteMany({ createdBy: ngo._id });
    await AuditLog.deleteMany({ "actor.userId": ngo._id });
    await TrustLog.deleteMany({ entityId: ngo._id });
    await Notification.deleteMany({ recipient: ngo._id });
  }

  console.log("✅ NGO test data cleared");
}

async function getNGOUser() {
  let ngo = await User.findOne({ email: "ngoo@gmail.com" });
  if (!ngo) {
    console.log("\n👤 Creating NGO user...");
    ngo = await User.create({
      name: "Hope Foundation NGO",
      email: "ngoo@gmail.com",
      passwordHash: await hashPassword("ngoo@gmail.com"),
      role: "NGO",
      verificationStatus: "APPROVED",
      isActive: true,
      emailVerified: true,
    });
    console.log("✅ NGO user created");
  } else {
    console.log("\n✅ NGO user already exists");
  }
  return ngo;
}

async function seedCampaigns(ngoId) {
  console.log("\n📋 Creating campaigns (draft, pending, active, completed)...");

  const draft = await Campaign.create({
    title: "Winter Relief for Homeless",
    description:
      "Provide warm clothes and blankets to homeless people during winter",
    disasterType: "OTHER",
    targetAmount: 200000,
    createdBy: ngoId,
    status: "DRAFT",
    jobIdHash: crypto.randomBytes(16).toString("hex"),
  });

  const pending = await Campaign.create({
    title: "Flood Relief - Kerala 2024",
    description: "Emergency relief for flood-affected families in Kerala",
    disasterType: "FLOOD",
    targetAmount: 500000,
    createdBy: ngoId,
    status: "PENDING_APPROVAL",
    submittedAt: new Date(),
    jobIdHash: crypto.randomBytes(16).toString("hex"),
  });

  const active = await Campaign.create({
    title: "Education for Underprivileged Children",
    description: "Provide school supplies and uniforms to 200 children",
    disasterType: "PANDEMIC",
    targetAmount: 300000,
    totalDonated: 150000,
    createdBy: ngoId,
    status: "ACTIVE",
    approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    jobIdHash: crypto.randomBytes(16).toString("hex"),
    trustScore: 75,
  });

  const completed = await Campaign.create({
    title: "COVID-19 Medical Aid",
    description: "Provided medical supplies during COVID-19 pandemic",
    disasterType: "PANDEMIC",
    targetAmount: 400000,
    totalDonated: 420000,
    totalAllocated: 400000,
    totalSpent: 380000,
    createdBy: ngoId,
    status: "COMPLETED",
    approvedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    jobIdHash: crypto.randomBytes(16).toString("hex"),
    trustScore: 85,
    totalBeneficiaries: 50,
    beneficiariesServed: 50,
  });

  console.log(
    "✅ Created 4 campaigns (1 draft, 1 pending, 1 active, 1 completed)",
  );
  return { draft, pending, active, completed };
}

async function seedDonors() {
  console.log("\n💰 Creating donors...");
  const donors = [];
  for (let i = 1; i <= 5; i++) {
    const donor = await User.create({
      name: `NGO Test Donor ${i}`,
      email: `ngodonor${i}@example.com`,
      passwordHash: await hashPassword("password123"),
      role: "DONOR",
      verificationStatus: "APPROVED",
      isActive: true,
      emailVerified: true,
    });
    donors.push(donor);
  }
  console.log(`✅ Created ${donors.length} donors`);
  return donors;
}

async function seedDonations(donors, activeCampaignId, completedCampaignId) {
  console.log("\n💸 Creating donations...");
  const donations = [];

  // Donations for active campaign
  for (let i = 0; i < 3; i++) {
    const donation = await Donation.create({
      donor: donors[i]._id,
      campaign: activeCampaignId,
      amount: 50000 + i * 25000,
      paymentMethod: "UPI",
      paymentStatus: "SUCCESS",
      status: "READY_FOR_USE",
      jobIdHash: crypto.randomBytes(16).toString("hex"),
    });
    donations.push(donation);
  }

  // Donations for completed campaign
  for (let i = 0; i < 4; i++) {
    const donation = await Donation.create({
      donor: donors[i % donors.length]._id,
      campaign: completedCampaignId,
      amount: 100000 + i * 30000,
      paymentMethod: "UPI",
      paymentStatus: "SUCCESS",
      status: "AUDIT_FINALIZED",
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      walletCreated: true,
      amountSpent: 80000 + i * 20000,
      auditFinalized: true,
    });
    donations.push(donation);
  }

  console.log(
    `✅ Created ${donations.length} donations (3 active, 4 completed)`,
  );
  return donations;
}

async function seedBeneficiaries(ngoId, activeCampaignId, completedCampaignId) {
  console.log("\n👥 Creating beneficiaries...");
  const beneficiaries = [];

  // Beneficiaries for active campaign
  for (let i = 1; i <= 8; i++) {
    const beneficiary = await Beneficiary.create({
      campaign: activeCampaignId,
      registeredBy: ngoId,
      name: `Active Campaign Beneficiary ${i}`,
      aadhaarHash: crypto
        .createHash("sha256")
        .update(`aadhaar_active_${i}`)
        .digest("hex"),
      phoneHash: crypto
        .createHash("sha256")
        .update(`phone_active_${i}`)
        .digest("hex"),
      status: i <= 5 ? "APPROVED" : "PENDING",
      ...(i <= 5 && {
        approvedAt: new Date(),
      }),
    });
    beneficiaries.push(beneficiary);
  }

  // Beneficiaries for completed campaign
  for (let i = 1; i <= 6; i++) {
    const beneficiary = await Beneficiary.create({
      campaign: completedCampaignId,
      registeredBy: ngoId,
      name: `Completed Campaign Beneficiary ${i}`,
      aadhaarHash: crypto
        .createHash("sha256")
        .update(`aadhaar_completed_${i}`)
        .digest("hex"),
      phoneHash: crypto
        .createHash("sha256")
        .update(`phone_completed_${i}`)
        .digest("hex"),
      status: "APPROVED",
      approvedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
    });
    beneficiaries.push(beneficiary);
  }

  console.log(
    `✅ Created ${beneficiaries.length} beneficiaries (8 active campaign, 6 completed campaign)`,
  );
  return beneficiaries;
}

async function seedWallets(
  ngoId,
  beneficiaries,
  activeCampaignId,
  completedCampaignId,
) {
  console.log("\n👛 Creating wallets...");
  const wallets = [];

  // Wallets for active campaign beneficiaries (first 5 approved)
  for (let i = 0; i < 5; i++) {
    const wallet = await Wallet.create({
      beneficiary: beneficiaries[i]._id,
      campaign: activeCampaignId,
      initialAmount: 10000,
      balance: 10000 - i * 1500,
      totalSpent: i * 1500,
      status: "ACTIVE",
      createdBy: ngoId,
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      transactionCount: i * 2,
    });
    wallets.push(wallet);
  }

  // Wallets for completed campaign beneficiaries (all spent)
  for (let i = 8; i < 14; i++) {
    const wallet = await Wallet.create({
      beneficiary: beneficiaries[i]._id,
      campaign: completedCampaignId,
      initialAmount: 15000,
      balance: 0,
      totalSpent: 15000,
      status: "CLOSED",
      createdBy: ngoId,
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      transactionCount: 10 + i,
      closedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      closeReason: "Campaign completed, all funds utilized",
    });
    wallets.push(wallet);
  }

  console.log(`✅ Created ${wallets.length} wallets (5 active, 6 closed)`);
  return wallets;
}

async function seedNotifications(ngoId, campaignIds) {
  console.log("\n🔔 Creating notifications...");

  const notifications = [
    {
      recipient: ngoId,
      role: "NGO",
      type: "CAMPAIGN_APPROVED",
      title: "Campaign Approved!",
      message:
        "Your campaign 'Education for Underprivileged Children' has been approved",
      priority: "HIGH",
      isRead: true,
      entityType: "Campaign",
      entityId: campaignIds[0].toString(),
      readAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    },
    {
      recipient: ngoId,
      role: "NGO",
      type: "DONATION_SUCCESS",
      title: "New Donation Received",
      message: "You received a donation of ₹50,000 for your campaign",
      priority: "HIGH",
      isRead: true,
      entityType: "Donation",
      entityId: new mongoose.Types.ObjectId().toString(),
      readAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      recipient: ngoId,
      role: "NGO",
      type: "BENEFICIARY_APPROVED",
      title: "Beneficiaries Approved",
      message: "5 beneficiaries have been approved for your campaign",
      priority: "NORMAL",
      isRead: false,
      entityType: "Beneficiary",
      entityId: new mongoose.Types.ObjectId().toString(),
    },
    {
      recipient: ngoId,
      role: "NGO",
      type: "WALLET_CREDITED",
      title: "Wallets Created",
      message: "5 wallets created for beneficiaries with total ₹50,000",
      priority: "NORMAL",
      isRead: false,
      entityType: "Wallet",
      entityId: new mongoose.Types.ObjectId().toString(),
    },
  ];

  for (const notif of notifications) {
    await Notification.create(notif);
  }

  console.log(`✅ Created ${notifications.length} notifications`);
}

async function seedNGOTestData() {
  try {
    await connectDB();

    const ngo = await getNGOUser();
    await clearNGOTestData("ngoo@gmail.com");

    const { draft, pending, active, completed } = await seedCampaigns(ngo._id);
    const donors = await seedDonors();
    const donations = await seedDonations(donors, active._id, completed._id);
    const beneficiaries = await seedBeneficiaries(
      ngo._id,
      active._id,
      completed._id,
    );
    const wallets = await seedWallets(
      ngo._id,
      beneficiaries,
      active._id,
      completed._id,
    );

    await seedNotifications(ngo._id, [active._id, completed._id]);

    console.log("\n" + "=".repeat(70));
    console.log("✅ COMPREHENSIVE NGO TEST DATA SEEDING COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n📊 Complete Summary:");
    console.log(`   • NGO: ngoo@gmail.com / ngoo@gmail.com`);
    console.log(
      `   • Campaigns: 4 (1 draft, 1 pending, 1 active, 1 completed)`,
    );
    console.log(`   • Donors: 5`);
    console.log(`   • Donations: 7 (3 active campaign, 4 completed campaign)`);
    console.log(
      `   • Beneficiaries: 14 (8 active campaign, 6 completed campaign)`,
    );
    console.log(`   • Wallets: 11 (5 active, 6 closed)`);
    console.log(`   • Notifications: 4 (2 read, 2 unread)`);

    console.log("\n🎯 Dashboard Will Show:");
    console.log("   ✅ Total Campaigns: 4");
    console.log("   ✅ Active Campaigns: 1");
    console.log("   ✅ Total Beneficiaries: 14");
    console.log("   ✅ Approved Beneficiaries: 11");
    console.log("   ✅ Total Donations: ₹5,70,000");
    console.log("   ✅ Wallets Created: 11");
    console.log("   ✅ Notifications: 4");

    console.log("\n🚀 Ready to test COMPLETE NGO system!");
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

seedNGOTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
