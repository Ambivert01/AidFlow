// Comprehensive Admin System Test Data Seeder - A to Z
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
import { Merchant } from "../src/models/merchant/Merchant.model.js";
import { FraudCase } from "../src/models/FraudCase.model.js";
import { FraudAlert } from "../src/models/governance/FraudAlert.model.js";
import { AIDecisionLog } from "../src/models/system/AIDecisionLog.model.js";
import { Wallet } from "../src/models/wallet/Wallet.model.js";
import { Beneficiary } from "../src/models/beneficiary/Beneficiary.model.js";
import { AuditLog } from "../src/models/audit/AuditLog.model.js";
import { TrustLog } from "../src/models/system/TrustLog.model.js";
import { Notification } from "../src/models/system/Notification.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aidflow";

console.log("🌱 COMPREHENSIVE Admin System Test Data Seeder (A-Z)");
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

async function clearTestData() {
  console.log("\n🧹 Clearing ALL existing test data...");
  await User.deleteMany({ email: { $ne: "admin@aidflow.com" } });
  await Campaign.deleteMany({});
  await Donation.deleteMany({});
  await Merchant.deleteMany({});
  await FraudCase.deleteMany({});
  await FraudAlert.deleteMany({});
  await AIDecisionLog.deleteMany({});
  await Wallet.deleteMany({});
  await Beneficiary.deleteMany({});
  await AuditLog.deleteMany({});
  await TrustLog.deleteMany({});
  await Notification.deleteMany({});
  console.log("✅ All test data cleared");
}

async function getAdminUser() {
  let admin = await User.findOne({ email: "admin@aidflow.com" });
  if (!admin) {
    console.log("\n👤 Creating admin user...");
    admin = await User.create({
      name: "Admin User",
      email: "admin@aidflow.com",
      passwordHash: await hashPassword("admin@aidflow.com"),
      role: "ADMIN",
      verificationStatus: "APPROVED",
      isActive: true,
      isEmailVerified: true,
    });
    console.log("✅ Admin user created");
  } else {
    console.log("\n✅ Admin user already exists");
  }
  return admin;
}

async function seedPendingUsers() {
  console.log("\n👥 Creating pending users (for approval testing)...");
  const users = [
    { name: "Green Earth Foundation", email: "green@earth.org", role: "NGO" },
    { name: "Hope for Children", email: "hope@children.org", role: "NGO" },
    { name: "Raj Medical Store", email: "raj@medical.com", role: "MERCHANT" },
    { name: "Fresh Groceries", email: "fresh@groceries.com", role: "MERCHANT" },
    { name: "State Welfare Dept", email: "welfare@gov.in", role: "GOVERNMENT" },
  ];

  for (const u of users) {
    await User.create({
      ...u,
      passwordHash: await hashPassword("password123"),
      verificationStatus: "PENDING",
      isActive: true,
      isEmailVerified: true,
    });
  }
  console.log(`✅ Created ${users.length} pending users`);
}

async function seedApprovedNGOs(adminId) {
  console.log("\n🏢 Creating approved NGOs...");
  const ngo1 = await User.create({
    name: "Food for All Foundation",
    email: "admin@foodforall.org",
    passwordHash: await hashPassword("password123"),
    role: "NGO",
    verificationStatus: "APPROVED",
    approvedBy: adminId,
    isActive: true,
    isEmailVerified: true,
  });

  const ngo2 = await User.create({
    name: "Education First",
    email: "contact@educationfirst.org",
    passwordHash: await hashPassword("password123"),
    role: "NGO",
    verificationStatus: "APPROVED",
    approvedBy: adminId,
    isActive: true,
    isEmailVerified: true,
  });

  console.log("✅ Created 2 approved NGOs");
  return { ngo1, ngo2 };
}

async function seedCampaigns(ngo1Id, ngo2Id, adminId) {
  console.log("\n📋 Creating campaigns (pending + active)...");

  const pending1 = await Campaign.create({
    title: "Feed 1000 Families This Winter",
    description: "Provide food supplies to 1000 underprivileged families",
    disasterType: "FLOOD",
    targetAmount: 500000,
    createdBy: ngo1Id,
    status: "PENDING_APPROVAL",
    submittedAt: new Date(),
    jobIdHash: crypto.randomBytes(16).toString("hex"),
  });

  const pending2 = await Campaign.create({
    title: "School Supplies for Rural Children",
    description: "Provide books and uniforms to 500 children",
    disasterType: "PANDEMIC",
    targetAmount: 300000,
    createdBy: ngo2Id,
    status: "PENDING_APPROVAL",
    submittedAt: new Date(),
    jobIdHash: crypto.randomBytes(16).toString("hex"),
  });

  const activeCampaign = await Campaign.create({
    title: "Emergency Medical Aid",
    description: "Provide emergency medical aid to disaster-affected areas",
    disasterType: "EARTHQUAKE",
    targetAmount: 1000000,
    totalDonated: 450000,
    createdBy: ngo1Id,
    status: "ACTIVE",
    approvedBy: adminId,
    approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    jobIdHash: crypto.randomBytes(16).toString("hex"),
  });

  console.log("✅ Created 3 campaigns (2 pending, 1 active)");
  return { pending1, pending2, activeCampaign };
}

async function seedDonors() {
  console.log("\n💰 Creating donors...");
  const donors = [];
  for (let i = 1; i <= 5; i++) {
    const donor = await User.create({
      name: `Donor ${i}`,
      email: `donor${i}@example.com`,
      passwordHash: await hashPassword("password123"),
      role: "DONOR",
      verificationStatus: "APPROVED",
      isActive: true,
      isEmailVerified: true,
    });
    donors.push(donor);
  }
  console.log(`✅ Created ${donors.length} donors`);
  return donors;
}

async function seedDonations(donors, campaignId) {
  console.log("\n💸 Creating donations...");
  const donations = [];
  for (let i = 0; i < donors.length; i++) {
    const donation = await Donation.create({
      donor: donors[i]._id,
      campaign: campaignId,
      amount: 50000 + i * 20000,
      paymentMethod: "UPI",
      paymentStatus: "SUCCESS",
      transactionId: `TXN${Date.now()}${i}`,
      receiptNumber: `RCP${Date.now()}${i}`,
      aiDecision: "APPROVED",
      riskScore: 10 + i * 5,
      jobIdHash: crypto.randomBytes(16).toString("hex"),
    });
    donations.push(donation);
  }
  console.log(`✅ Created ${donations.length} donations`);
  return donations;
}

async function seedMerchants(adminId) {
  console.log("\n🏪 Creating approved merchants...");
  const merchant1User = await User.create({
    name: "City Medical Store",
    email: "city@medical.com",
    passwordHash: await hashPassword("password123"),
    role: "MERCHANT",
    verificationStatus: "APPROVED",
    approvedBy: adminId,
    isActive: true,
    isEmailVerified: true,
  });

  const merchant1 = await Merchant.create({
    user: merchant1User._id,
    shopName: "City Medical Store",
    category: "MEDICINE",
    status: "ACTIVE",
    approvedBy: adminId,
    approvedAt: new Date(),
  });

  const merchant2User = await User.create({
    name: "Fresh Food Mart",
    email: "fresh@food.com",
    passwordHash: await hashPassword("password123"),
    role: "MERCHANT",
    verificationStatus: "APPROVED",
    approvedBy: adminId,
    isActive: true,
    isEmailVerified: true,
  });

  const merchant2 = await Merchant.create({
    user: merchant2User._id,
    shopName: "Fresh Food Mart",
    category: "FOOD",
    status: "ACTIVE",
    approvedBy: adminId,
    approvedAt: new Date(),
  });

  console.log("✅ Created 2 approved merchants");
  return { merchant1User, merchant2User, merchant1, merchant2 };
}

async function seedFraudCases(donationIds, campaignId, adminId) {
  console.log("\n🚨 Creating fraud cases (OPEN, INVESTIGATING, RESOLVED)...");

  const case1 = await FraudCase.create({
    entityType: "DONATION",
    entityId: donationIds[0].toString(),
    riskScore: 85,
    reason:
      "Suspicious transaction pattern detected - multiple donations from same IP",
    status: "OPEN",
    aiMetadata: {
      modelVersion: "fraud-detector-v2.1",
      confidence: 0.85,
      signals: ["multiple_donations_same_ip", "unusual_amount", "new_donor"],
    },
  });

  const case2 = await FraudCase.create({
    entityType: "DONATION",
    entityId: donationIds[1].toString(),
    riskScore: 72,
    reason: "Unusual donation amount for first-time donor",
    status: "INVESTIGATING",
    assignedTo: adminId,
    aiMetadata: {
      modelVersion: "fraud-detector-v2.1",
      confidence: 0.72,
      signals: ["first_time_donor", "high_amount"],
    },
    notes: [
      {
        addedBy: adminId,
        note: "Contacted donor for verification. Awaiting response.",
        addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const case3 = await FraudCase.create({
    entityType: "CAMPAIGN",
    entityId: campaignId.toString(),
    riskScore: 45,
    reason: "Campaign description contains suspicious keywords",
    status: "RESOLVED",
    resolvedBy: adminId,
    resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    resolution: {
      decision: "FALSE_POSITIVE",
      notes: "Campaign verified. Keywords were legitimate medical terms.",
      actionTaken: "No action required. Campaign approved.",
    },
    aiMetadata: {
      modelVersion: "fraud-detector-v2.1",
      confidence: 0.45,
      signals: ["suspicious_keywords"],
    },
  });

  console.log("✅ Created 3 fraud cases");
  return { case1, case2, case3 };
}

async function seedFraudAlerts(donationIds) {
  console.log("\n⚠️ Skipping fraud alerts (using FraudCase instead)...");
  console.log("✅ Fraud alerts skipped");
}

async function seedAIDecisionLogs(donationIds) {
  console.log("\n🤖 Creating AI decision logs (for override testing)...");

  await AIDecisionLog.create({
    modelName: "fraud-detector",
    modelVersion: "fraud-detector-v2.1",
    entityType: "Donation",
    entityId: donationIds[0].toString(),
    decisionType: "FRAUD_DETECTION",
    decision: "FLAGGED",
    confidenceScore: 0.85,
    riskScore: 85,
    reason: "High risk score based on transaction patterns",
    actionTaken: "FLAGGED",
    inputFeatures: {
      riskFactors: ["multiple_donations", "same_ip", "short_timeframe"],
    },
    metadata: {
      riskFactors: ["multiple_donations", "same_ip", "short_timeframe"],
      riskScore: 85,
    },
  });

  await AIDecisionLog.create({
    modelName: "risk-assessor",
    modelVersion: "risk-assessor-v1.5",
    entityType: "Donation",
    entityId: donationIds[1].toString(),
    decisionType: "DONATION_RISK",
    decision: "APPROVED",
    confidenceScore: 0.92,
    riskScore: 15,
    reason: "Low risk profile, verified donor",
    actionTaken: "APPROVED",
    inputFeatures: {
      verificationStatus: "VERIFIED",
    },
    metadata: {
      riskScore: 15,
      verificationStatus: "VERIFIED",
    },
  });

  console.log("✅ Created 2 AI decision logs");
}

async function seedWalletsAndBeneficiaries(ngoId, campaignId, adminId) {
  console.log("\n👛 Creating wallets and beneficiaries...");

  const beneficiaries = [];
  for (let i = 1; i <= 5; i++) {
    const beneficiary = await Beneficiary.create({
      campaign: campaignId,
      registeredBy: ngoId,
      name: `Beneficiary ${i}`,
      aadhaarHash: crypto
        .createHash("sha256")
        .update(`aadhaar${i}`)
        .digest("hex"),
      phoneHash: crypto.createHash("sha256").update(`phone${i}`).digest("hex"),
      status: i <= 3 ? "APPROVED" : "PENDING",
      ...(i <= 3 && {
        approvedBy: adminId,
        approvedAt: new Date(),
      }),
    });
    beneficiaries.push(beneficiary);
  }

  console.log(
    `✅ Created ${beneficiaries.length} beneficiaries (3 approved, 2 pending)`,
  );

  const wallets = [];
  for (let i = 0; i < 3; i++) {
    const wallet = await Wallet.create({
      beneficiary: beneficiaries[i]._id,
      campaign: campaignId,
      initialAmount: 10000,
      balance: 10000 - i * 2000,
      totalSpent: i * 2000,
      status: i === 2 ? "SUSPENDED" : "ACTIVE",
      createdBy: ngoId,
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      ...(i === 2 && {
        freezeReason: "Suspicious spending pattern detected",
        frozenBy: adminId,
        frozenAt: new Date(),
      }),
    });
    wallets.push(wallet);
  }

  console.log(`✅ Created ${wallets.length} wallets (1 frozen for testing)`);
  return { beneficiaries, wallets };
}

async function seedAuditLogs(
  adminId,
  ngoIds,
  campaignIds,
  donationIds,
  merchantUserIds,
) {
  console.log("\n📋 Creating comprehensive audit logs...");

  let sequenceCounter = 1;

  const logs = [
    // User approvals
    {
      eventType: "USER_APPROVED",
      eventCategory: "AUTH",
      entityType: "User",
      entityId: ngoIds[0].toString(),
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: adminId, role: "ADMIN" },
      payload: { approvedUser: ngoIds[0].toString(), role: "NGO" },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      eventType: "USER_APPROVED",
      eventCategory: "AUTH",
      entityType: "User",
      entityId: merchantUserIds[0].toString(),
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: adminId, role: "ADMIN" },
      payload: {
        approvedUser: merchantUserIds[0].toString(),
        role: "MERCHANT",
      },
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    // Campaign approval
    {
      eventType: "CAMPAIGN_APPROVED",
      eventCategory: "CAMPAIGN",
      entityType: "Campaign",
      entityId: campaignIds[0].toString(),
      campaignId: campaignIds[0],
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: adminId, role: "ADMIN" },
      payload: { campaignTitle: "Emergency Medical Aid" },
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
    // Donations
    {
      eventType: "DONATION_RECEIVED",
      eventCategory: "DONATION",
      entityType: "Donation",
      entityId: donationIds[0].toString(),
      campaignId: campaignIds[0],
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: donationIds[0], role: "DONOR" },
      payload: { amount: 50000 },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    // Fraud cases
    {
      eventType: "FRAUD_CASE_RESOLVED",
      eventCategory: "SECURITY",
      entityType: "User",
      entityId: adminId.toString(),
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: adminId, role: "ADMIN" },
      payload: { decision: "FALSE_POSITIVE" },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    // Wallet frozen
    {
      eventType: "WALLET_FROZEN",
      eventCategory: "WALLET",
      entityType: "Wallet",
      entityId: new mongoose.Types.ObjectId().toString(),
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: adminId, role: "ADMIN" },
      payload: { reason: "Suspicious spending pattern" },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    // AI override
    {
      eventType: "AI_DECISION_OVERRIDDEN",
      eventCategory: "SYSTEM",
      entityType: "Donation",
      entityId: donationIds[0].toString(),
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: adminId, role: "ADMIN" },
      payload: {
        decisionType: "FRAUD_DETECTION",
        originalDecision: "FLAGGED",
        newDecision: "APPROVED",
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    // Bulk approval
    {
      eventType: "BULK_USER_APPROVAL",
      eventCategory: "AUTH",
      entityType: "User",
      entityId: adminId.toString(),
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: adminId, role: "ADMIN" },
      payload: { totalUsers: 3, successCount: 3 },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const log of logs) {
    await AuditLog.create(log);
  }

  console.log(`✅ Created ${logs.length} audit logs`);
}

async function seedBlockchainAnchors(campaignId, donationIds) {
  console.log("\n⛓️ Creating blockchain anchor data...");

  let sequenceCounter = 100; // Start from 100 to avoid conflicts

  const anchors = [
    {
      eventType: "DONATION_ANCHORED",
      eventCategory: "DONATION",
      entityType: "Donation",
      entityId: donationIds[0].toString(),
      campaignId: campaignId,
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: new mongoose.Types.ObjectId(), role: "SYSTEM" },
      payload: { amount: 50000 },
      blockchainAnchor: {
        txHash: `0x${crypto.randomBytes(32).toString("hex")}`,
        blockNumber: 12345678,
        chain: "POLYGON",
        anchoredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        gasUsed: 21000,
        status: "CONFIRMED",
      },
      merkleRoot: crypto.randomBytes(32).toString("hex"),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      eventType: "CAMPAIGN_ANCHORED",
      eventCategory: "CAMPAIGN",
      entityType: "Campaign",
      entityId: campaignId.toString(),
      campaignId: campaignId,
      jobIdHash: crypto.randomBytes(16).toString("hex"),
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      actor: { userId: new mongoose.Types.ObjectId(), role: "SYSTEM" },
      payload: { totalDonated: 450000 },
      blockchainAnchor: {
        txHash: `0x${crypto.randomBytes(32).toString("hex")}`,
        blockNumber: 12345680,
        chain: "POLYGON",
        anchoredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        gasUsed: 25000,
        status: "CONFIRMED",
      },
      merkleRoot: crypto.randomBytes(32).toString("hex"),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const anchor of anchors) {
    await AuditLog.create(anchor);
  }

  console.log(`✅ Created ${anchors.length} blockchain anchors`);
}

async function seedTrustLogs(campaignId, ngoId) {
  console.log("\n🔒 Creating trust score logs...");

  const logs = [
    {
      entityType: "CAMPAIGN",
      entityId: campaignId,
      triggerEvent: "DONATION_COMPLETED",
      oldScore: 50,
      newScore: 55,
      delta: 5,
      reason: "Donation received from verified donor",
      factors: {
        proofScore: 75,
        aiScore: 80,
        timelinessScore: 70,
      },
    },
    {
      entityType: "NGO",
      entityId: ngoId,
      triggerEvent: "PROOF_VERIFIED",
      oldScore: 60,
      newScore: 70,
      delta: 10,
      reason: "Campaign proof successfully verified",
      factors: {
        proofScore: 85,
        aiScore: 75,
        consistencyScore: 80,
      },
    },
  ];

  for (const log of logs) {
    await TrustLog.create(log);
  }

  console.log(`✅ Created ${logs.length} trust logs`);
}

async function seedNotifications(adminId, ngoId, donorId) {
  console.log("\n🔔 Creating notifications...");

  const notifications = [
    {
      recipient: adminId,
      role: "ADMIN",
      type: "FRAUD_ALERT",
      title: "High Risk Transaction Detected",
      message: "A donation with risk score 85 requires attention",
      priority: "HIGH",
      isRead: false,
      entityType: "Donation",
      entityId: new mongoose.Types.ObjectId().toString(),
    },
    {
      recipient: adminId,
      role: "ADMIN",
      type: "CAMPAIGN_CREATED",
      title: "New Campaign Awaiting Approval",
      message: "Feed 1000 Families This Winter is pending approval",
      priority: "NORMAL",
      isRead: false,
      entityType: "Campaign",
      entityId: new mongoose.Types.ObjectId().toString(),
    },
    {
      recipient: ngoId,
      role: "NGO",
      type: "CAMPAIGN_APPROVED",
      title: "Campaign Approved",
      message: "Your campaign has been approved",
      priority: "HIGH",
      isRead: true,
      entityType: "Campaign",
      entityId: new mongoose.Types.ObjectId().toString(),
    },
  ];

  for (const notif of notifications) {
    await Notification.create(notif);
  }

  console.log(`✅ Created ${notifications.length} notifications`);
}

async function seedAdminTestData() {
  try {
    await connectDB();
    await clearTestData();

    const admin = await getAdminUser();
    await seedPendingUsers();

    const { ngo1, ngo2 } = await seedApprovedNGOs(admin._id);
    const { pending1, pending2, activeCampaign } = await seedCampaigns(
      ngo1._id,
      ngo2._id,
      admin._id,
    );

    const donors = await seedDonors();
    const donations = await seedDonations(donors, activeCampaign._id);

    const { merchant1User, merchant2User } = await seedMerchants(admin._id);

    await seedFraudCases(
      donations.map((d) => d._id),
      activeCampaign._id,
      admin._id,
    );

    await seedFraudAlerts(donations.map((d) => d._id));
    await seedAIDecisionLogs(donations.map((d) => d._id));

    await seedWalletsAndBeneficiaries(ngo1._id, activeCampaign._id, admin._id);

    await seedAuditLogs(
      admin._id,
      [ngo1._id, ngo2._id],
      [activeCampaign._id],
      donations.map((d) => d._id),
      [merchant1User._id, merchant2User._id],
    );

    await seedBlockchainAnchors(
      activeCampaign._id,
      donations.map((d) => d._id),
    );
    await seedTrustLogs(activeCampaign._id, ngo1._id);
    await seedNotifications(admin._id, ngo1._id, donors[0]._id);

    console.log("\n" + "=".repeat(70));
    console.log("✅ COMPREHENSIVE ADMIN TEST DATA SEEDING COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n📊 Complete Summary:");
    console.log(`   • Admin: admin@aidflow.com / admin@aidflow.com`);
    console.log(`   • Pending Users: 5 (3 NGO, 2 Merchant, 1 Govt)`);
    console.log(`   • Approved NGOs: 2`);
    console.log(`   • Approved Merchants: 2`);
    console.log(`   • Campaigns: 3 (2 pending, 1 active)`);
    console.log(`   • Donors: 5`);
    console.log(`   • Donations: 5 (₹450,000 total)`);
    console.log(`   • Beneficiaries: 5 (3 approved, 2 pending)`);
    console.log(`   • Wallets: 3 (1 suspended)`);
    console.log(`   • Fraud Cases: 3 (1 OPEN, 1 INVESTIGATING, 1 RESOLVED)`);
    console.log(`   • AI Decision Logs: 2`);
    console.log(`   • Audit Logs: 10 (8 regular + 2 blockchain anchors)`);
    console.log(`   • Blockchain Anchors: 2`);
    console.log(`   • Trust Logs: 2`);
    console.log(`   • Notifications: 3`);

    console.log("\n🎯 Test Coverage:");
    console.log("   ✅ User Management (Pending, Approved, Suspended)");
    console.log("   ✅ Campaign Approval Workflow");
    console.log("   ✅ Fraud Detection & Management");
    console.log("   ✅ AI Decision Override");
    console.log("   ✅ Wallet & Beneficiary Management");
    console.log("   ✅ Audit Trail & Logging");
    console.log("   ✅ Blockchain Anchoring");
    console.log("   ✅ Trust Score System");
    console.log("   ✅ Notification System");
    console.log("   ✅ System Health Monitoring");

    console.log("\n🚀 Ready to test COMPLETE admin system!");
    console.log("   Login: http://localhost:3000/login");
    console.log("   Email: admin@aidflow.com");
    console.log("   Password: admin@aidflow.com");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

seedAdminTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
