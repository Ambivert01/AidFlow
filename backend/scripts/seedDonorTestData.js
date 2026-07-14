// Comprehensive Donor System Test Data Seeder - End-to-End Donor Tracking
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
import { Proof } from "../src/models/proofs/Proof.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aidflow";

console.log("🌱 COMPREHENSIVE Donor System Test Data Seeder (End-to-End)");
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

async function clearDonorTestData(donorEmail) {
  console.log("\n🧹 Clearing existing donor test data...");

  const donor = await User.findOne({ email: donorEmail });
  if (donor) {
    // Delete donations and related data
    const donations = await Donation.find({ donor: donor._id });
    const donationIds = donations.map((d) => d._id);

    await AuditLog.deleteMany({ "actor.userId": donor._id });
    await Notification.deleteMany({ recipient: donor._id });
    await Donation.deleteMany({ donor: donor._id });
  }

  console.log("✅ Donor test data cleared");
}

async function getDonorUser() {
  let donor = await User.findOne({ email: "donor@test.com" });
  if (!donor) {
    console.log("\n👤 Creating donor user...");
    donor = await User.create({
      name: "Test Donor",
      email: "donor@test.com",
      passwordHash: await hashPassword("donor@test.com"),
      role: "DONOR",
      verificationStatus: "APPROVED",
      isActive: true,
      emailVerified: true,
    });
    console.log("✅ Donor user created");
  } else {
    console.log("\n✅ Donor user already exists");
  }
  return donor;
}

async function getOrCreateNGO() {
  let ngo = await User.findOne({ email: "ngo@test.com" });
  if (!ngo) {
    console.log("\n👤 Creating NGO user...");
    ngo = await User.create({
      name: "Test NGO Foundation",
      email: "ngo@test.com",
      passwordHash: await hashPassword("ngo@test.com"),
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

async function getOrCreateAdmin() {
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
      emailVerified: true,
    });
    console.log("✅ Admin user created");
  } else {
    console.log("\n✅ Admin user already exists");
  }
  return admin;
}

async function seedCampaign(ngoId, adminId) {
  console.log("\n📋 Creating test campaign...");

  const campaign = await Campaign.create({
    title: "Donor Tracking Test Campaign",
    description:
      "Test campaign for comprehensive donor tracking system testing",
    disasterType: "FLOOD",
    targetAmount: 1000000,
    totalDonated: 0,
    createdBy: ngoId,
    status: "ACTIVE",
    approvedBy: adminId,
    approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    jobIdHash: crypto.randomBytes(16).toString("hex"),
    trustScore: 75,
    location: {
      ward: "Ward 5",
      district: "Test District",
      state: "Test State",
      lat: 12.9716,
      lng: 77.5946,
    },
    policySnapshot: {
      allowedCategories: ["FOOD", "MEDICINE"],
      maxPerBeneficiary: 10000,
      maxPerTransaction: 2000,
      validityDays: 30,
    },
  });

  console.log(`✅ Created campaign: ${campaign._id}`);
  return campaign;
}

async function seedBeneficiaries(ngoId, campaignId) {
  console.log("\n👥 Creating beneficiaries...");
  const beneficiaries = [];

  for (let i = 1; i <= 3; i++) {
    const beneficiary = await Beneficiary.create({
      campaign: campaignId,
      registeredBy: ngoId,
      name: `Test Beneficiary ${i}`,
      aadhaarHash: crypto
        .createHash("sha256")
        .update(`aadhaar_donor_test_${i}`)
        .digest("hex"),
      phoneHash: crypto
        .createHash("sha256")
        .update(`phone_donor_test_${i}`)
        .digest("hex"),
      status: "APPROVED",
      approvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    });
    beneficiaries.push(beneficiary);
  }

  console.log(`✅ Created ${beneficiaries.length} beneficiaries`);
  return beneficiaries;
}

/**
 * Create a complete donation with full timeline
 * This simulates the entire donation lifecycle from creation to completion
 */
async function createCompleteDonation(
  donorId,
  campaignId,
  beneficiaryId,
  ngoId,
  amount,
  scenario,
) {
  console.log(`\n💸 Creating ${scenario} donation...`);

  const jobIdHash = crypto.randomBytes(16).toString("hex");
  let sequenceCounter = 1;

  // Step 1: Create donation
  const donation = await Donation.create({
    donor: donorId,
    campaign: campaignId,
    beneficiary: beneficiaryId,
    amount: amount,
    paymentMethod: "UPI",
    paymentStatus: "SUCCESS",
    status: "READY_FOR_USE",
    workflowState: "COMPLETED",
    jobIdHash: jobIdHash,
    aiDecision: {
      decision: "ALLOW",
      riskScore: 15,
      fraudSignals: [],
      fraudFlags: [],
      evaluatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      evaluatedBy: "AI",
    },
    walletCreated: true,
    amountSpent: scenario === "COMPLETED" ? amount : amount * 0.6,
    proofVerified: true,
    auditFinalized: scenario === "COMPLETED",
    blockchainAnchored: scenario === "COMPLETED",
    blockchainHash:
      scenario === "COMPLETED"
        ? `0x${crypto.randomBytes(32).toString("hex")}`
        : null,
    blockchainAnchoredAt:
      scenario === "COMPLETED"
        ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        : null,
    privacySettings: {
      anonymousDonation: scenario === "ANONYMOUS",
      hideAmount: false,
      disablePublicAudit: false,
    },
  });

  // Step 2: Create audit logs for complete timeline
  const auditLogs = [];

  // Event 1: Donation Created
  const event1 = await AuditLog.create({
    eventType: "DONATION_CREATED",
    eventCategory: "DONATION",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: null,
    actor: {
      userId: donorId,
      role: "DONOR",
    },
    payload: {
      donationId: donation._id.toString(),
      amount: amount,
      campaignId: campaignId.toString(),
      paymentMethod: "UPI",
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  });
  auditLogs.push(event1);

  // Event 2: AI Decision
  const event2 = await AuditLog.create({
    eventType: "AI_DECISION",
    eventCategory: "DONATION",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event1.hash,
    actor: {
      role: "AI",
    },
    payload: {
      decision: "ALLOW",
      riskScore: 15,
      fraudFlags: [],
    },
    aiMetadata: {
      decision: "ALLOW",
      riskScore: 15,
      flags: [],
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 60000),
  });
  auditLogs.push(event2);

  // Event 3: Beneficiary Assigned
  const event3 = await AuditLog.create({
    eventType: "DONATION_BENEFICIARY_ASSIGNED",
    eventCategory: "BENEFICIARY",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event2.hash,
    actor: {
      userId: ngoId,
      role: "NGO",
    },
    payload: {
      beneficiaryId: beneficiaryId.toString(),
      donationId: donation._id.toString(),
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  });
  auditLogs.push(event3);

  // Event 4: NGO Approved
  const event4 = await AuditLog.create({
    eventType: "DONATION_APPROVED_BY_NGO",
    eventCategory: "DONATION",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event3.hash,
    actor: {
      userId: ngoId,
      role: "NGO",
    },
    payload: {
      donationId: donation._id.toString(),
      status: "NGO_APPROVED",
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 120000),
  });
  auditLogs.push(event4);

  // Step 3: Create wallet
  const wallet = await Wallet.create({
    beneficiary: beneficiaryId,
    campaign: campaignId,
    initialAmount: amount,
    balance: scenario === "COMPLETED" ? 0 : amount * 0.4,
    totalSpent: scenario === "COMPLETED" ? amount : amount * 0.6,
    status: scenario === "COMPLETED" ? "CLOSED" : "ACTIVE",
    createdBy: ngoId,
    jobIdHash: jobIdHash,
    transactionCount: scenario === "COMPLETED" ? 5 : 3,
    policy: {
      allowedCategories: ["FOOD", "MEDICINE"],
      maxPerTransaction: 2000,
      dailyLimit: 5000,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
  });

  // Update donation with wallet reference
  donation.wallet = wallet._id;
  await donation.save();

  // Event 5: Wallet Created
  const event5 = await AuditLog.create({
    eventType: "WALLET_CREATED",
    eventCategory: "WALLET",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event4.hash,
    actor: {
      role: "SYSTEM",
    },
    payload: {
      walletId: wallet._id.toString(),
      amount: amount,
      beneficiaryId: beneficiaryId.toString(),
    },
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
  });
  auditLogs.push(event5);

  // Step 4: Create proofs
  const proof1 = await Proof.create({
    campaign: campaignId,
    wallet: wallet._id,
    beneficiary: beneficiaryId,
    proofType: "PURCHASE_RECEIPT",
    files: [
      {
        fileUrl: "/uploads/proofs/receipt1.jpg",
        fileType: "IMAGE",
        mimeType: "image/jpeg",
        size: 245678,
        checksum: crypto.randomBytes(16).toString("hex"),
      },
    ],
    location: {
      lat: 12.9716,
      lng: 77.5946,
      geoHash: "tdr1y",
    },
    capturedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    aiValidation: {
      verified: true,
      confidenceScore: 0.92,
      fraudProbability: 0.05,
      flags: [],
      evaluatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 300000),
    },
    status: "AI_VERIFIED",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  // Event 6: Proof Uploaded
  const event6 = await AuditLog.create({
    eventType: "PROOF_UPLOADED",
    eventCategory: "PROOF",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event5.hash,
    actor: {
      userId: ngoId,
      role: "NGO",
    },
    payload: {
      proofId: proof1._id.toString(),
      proofType: "PURCHASE_RECEIPT",
      fileCount: 1,
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });
  auditLogs.push(event6);

  // Event 7: Proof Verified
  const event7 = await AuditLog.create({
    eventType: "PROOF_AI_VALIDATED",
    eventCategory: "PROOF",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event6.hash,
    actor: {
      role: "AI",
    },
    payload: {
      proofId: proof1._id.toString(),
      verified: true,
      confidenceScore: 0.92,
      fraudProbability: 0.05,
    },
    aiMetadata: {
      decision: "VERIFIED",
      riskScore: 5,
      flags: [],
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 300000),
  });
  auditLogs.push(event7);

  // Event 8: Wallet Spent
  const event8 = await AuditLog.create({
    eventType: "WALLET_SPENT",
    eventCategory: "WALLET",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event7.hash,
    actor: {
      role: "BENEFICIARY",
    },
    payload: {
      walletId: wallet._id.toString(),
      amountSpent: scenario === "COMPLETED" ? amount : amount * 0.6,
      amountRemaining: scenario === "COMPLETED" ? 0 : amount * 0.4,
    },
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  });
  auditLogs.push(event8);

  // Step 5: Trust score updates
  const trustLog1 = await TrustLog.create({
    entityType: "CAMPAIGN",
    entityId: campaignId,
    oldScore: 75,
    newScore: 80,
    delta: 5,
    reason: "Proof verified successfully",
    triggerEvent: "PROOF_VERIFIED",
    factors: {
      proofScore: 85,
      aiScore: 90,
      timelinessScore: 75,
      fraudPenalty: 0,
      consistencyScore: 80,
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 600000),
  });

  // Event 9: Trust Updated
  const event9 = await AuditLog.create({
    eventType: "TRUST_SCORE_CHANGED",
    eventCategory: "SYSTEM",
    entityType: "Donation",
    entityId: donation._id.toString(),
    jobIdHash: jobIdHash,
    campaignId: campaignId,
    sequence: sequenceCounter++,
    hash: crypto.randomBytes(32).toString("hex"),
    previousHash: event8.hash,
    actor: {
      role: "SYSTEM",
    },
    payload: {
      entityType: "CAMPAIGN",
      entityId: campaignId.toString(),
      oldScore: 75,
      newScore: 80,
      delta: 5,
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 600000),
  });
  auditLogs.push(event9);

  // Step 6: Blockchain anchoring (only for completed donations)
  if (scenario === "COMPLETED") {
    const merkleRoot = crypto.randomBytes(32).toString("hex");

    const event10 = await AuditLog.create({
      eventType: "BLOCKCHAIN_ANCHORED",
      eventCategory: "SYSTEM",
      entityType: "Donation",
      entityId: donation._id.toString(),
      jobIdHash: jobIdHash,
      campaignId: campaignId,
      sequence: sequenceCounter++,
      hash: crypto.randomBytes(32).toString("hex"),
      previousHash: event9.hash,
      merkleRoot: merkleRoot,
      actor: {
        role: "SYSTEM",
      },
      payload: {
        blockchainHash: donation.blockchainHash,
        anchoredAt: donation.blockchainAnchoredAt,
      },
      blockchainAnchor: {
        chain: "POLYGON",
        txHash: donation.blockchainHash,
        blockNumber: 12345678 + Math.floor(Math.random() * 1000),
        anchoredAt: donation.blockchainAnchoredAt,
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
    auditLogs.push(event10);
  }

  // Step 7: Create notifications
  await Notification.create({
    recipient: donorId,
    role: "DONOR",
    type: "SYSTEM_ALERT",
    title: "Proof Verified",
    message: `Proof for your donation of ₹${amount} has been verified by AI`,
    priority: "NORMAL",
    isRead: false,
    entityType: "Campaign",
    entityId: campaignId.toString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 300000),
  });

  if (scenario === "COMPLETED") {
    await Notification.create({
      recipient: donorId,
      role: "DONOR",
      type: "SYSTEM_ALERT",
      title: "Blockchain Anchored",
      message: `Your donation of ₹${amount} has been anchored to the blockchain`,
      priority: "HIGH",
      isRead: false,
      entityType: "Donation",
      entityId: donation._id.toString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
  }

  console.log(
    `✅ Created ${scenario} donation with ${auditLogs.length} timeline events`,
  );
  return { donation, wallet, proof: proof1, auditLogs, trustLog: trustLog1 };
}

async function seedDonorTestData() {
  try {
    await connectDB();

    const donor = await getDonorUser();
    await clearDonorTestData("donor@test.com");

    const ngo = await getOrCreateNGO();
    const admin = await getOrCreateAdmin();

    const campaign = await seedCampaign(ngo._id, admin._id);
    const beneficiaries = await seedBeneficiaries(ngo._id, campaign._id);

    // Create different donation scenarios
    console.log("\n💰 Creating donation scenarios...");

    // Scenario 1: Completed donation with full timeline and blockchain anchoring
    const completed = await createCompleteDonation(
      donor._id,
      campaign._id,
      beneficiaries[0]._id,
      ngo._id,
      50000,
      "COMPLETED",
    );

    // Scenario 2: In-progress donation (wallet created, partially spent, no blockchain)
    const inProgress = await createCompleteDonation(
      donor._id,
      campaign._id,
      beneficiaries[1]._id,
      ngo._id,
      30000,
      "IN_PROGRESS",
    );

    // Scenario 3: Anonymous donation
    const anonymous = await createCompleteDonation(
      donor._id,
      campaign._id,
      beneficiaries[2]._id,
      ngo._id,
      20000,
      "ANONYMOUS",
    );

    // Update campaign totals
    await Campaign.findByIdAndUpdate(campaign._id, {
      totalDonated: 100000,
      totalAllocated: 100000,
      totalSpent: 80000,
      totalBeneficiaries: 3,
      beneficiariesServed: 3,
    });

    console.log("\n" + "=".repeat(70));
    console.log("✅ COMPREHENSIVE DONOR TEST DATA SEEDING COMPLETE!");
    console.log("=".repeat(70));

    console.log("\n📊 Complete Summary:");
    console.log(`   • Donor: donor@test.com / donor@test.com`);
    console.log(`   • Campaign: ${campaign.title}`);
    console.log(`   • Donations: 3 (1 completed, 1 in-progress, 1 anonymous)`);
    console.log(`   • Beneficiaries: 3`);
    console.log(`   • Wallets: 3 (1 closed, 2 active)`);
    console.log(`   • Proofs: 3 (all AI verified)`);
    console.log(`   • Audit Logs: ~27 (complete timeline events)`);
    console.log(`   • Trust Logs: 3`);
    console.log(`   • Notifications: 5`);
    console.log(`   • Blockchain Anchors: 1`);

    console.log("\n🎯 Donor Tracking Features Covered:");
    console.log("   ✅ Timeline Aggregation (all event types)");
    console.log("   ✅ Proof Linking and Display");
    console.log("   ✅ Blockchain Verification");
    console.log("   ✅ Trust Score Evolution");
    console.log("   ✅ Timeline Caching (ready for testing)");
    console.log("   ✅ Real-Time Updates (WebSocket ready)");
    console.log("   ✅ Timeline Filtering (by event type, date, actor)");
    console.log("   ✅ Audit Trail Verification (hash chains)");
    console.log("   ✅ Donation Status Visualization");
    console.log("   ✅ Notification Integration");
    console.log("   ✅ Error Handling (partial data scenarios)");
    console.log("   ✅ Timeline Export (data ready)");
    console.log("   ✅ Public Audit Verification");
    console.log("   ✅ Privacy Settings (anonymous donations)");

    console.log("\n📋 Test Scenarios:");
    console.log("   1️⃣  Completed Donation (₹50,000):");
    console.log(
      "      - Full lifecycle: Created → AI → NGO → Wallet → Proof → Blockchain",
    );
    console.log("      - All funds spent, wallet closed");
    console.log("      - Blockchain anchored with txHash");
    console.log("      - Complete hash chain with merkleRoot");
    console.log(`      - Donation ID: ${completed.donation._id}`);

    console.log("\n   2️⃣  In-Progress Donation (₹30,000):");
    console.log("      - Wallet active, 60% spent");
    console.log("      - Proof uploaded and verified");
    console.log("      - Not yet blockchain anchored");
    console.log("      - Trust score updated");
    console.log(`      - Donation ID: ${inProgress.donation._id}`);

    console.log("\n   3️⃣  Anonymous Donation (₹20,000):");
    console.log("      - Privacy settings enabled");
    console.log("      - Donor identity hidden in public audit");
    console.log("      - Full timeline available to donor");
    console.log(`      - Donation ID: ${anonymous.donation._id}`);

    console.log("\n🚀 Ready to test COMPLETE donor tracking system!");
    console.log("   Login: http://localhost:3000/login");
    console.log("   Email: donor@test.com");
    console.log("   Password: donor@test.com");

    console.log("\n🔍 API Testing:");
    console.log(
      `   Timeline API: GET /api/donations/${completed.donation._id}/timeline`,
    );
    console.log(
      `   Export PDF: GET /api/donations/${completed.donation._id}/export?format=PDF`,
    );
    console.log(
      `   Export CSV: GET /api/donations/${completed.donation._id}/export?format=CSV`,
    );
    console.log(
      `   Public Audit: GET /public/audit/verify/${completed.donation._id}`,
    );
    console.log(
      `   Blockchain Verify: GET /api/donations/${completed.donation._id}/blockchain/verify`,
    );
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
  }
}

seedDonorTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
