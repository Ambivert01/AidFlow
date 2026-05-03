import fc from "fast-check";
import mongoose from "mongoose";

/**
 * Property test helper utilities for wallet allocation system
 */

// Arbitraries for generating test data
export const arbitraries = {
  // Generate valid ObjectId
  objectId: () => fc.hexaString({ minLength: 24, maxLength: 24 }),

  // Generate amount (1 to 1000000)
  amount: () => fc.integer({ min: 1, max: 1000000 }),

  // Generate small amount (10 to 500)
  smallAmount: () => fc.integer({ min: 10, max: 500 }),

  // Generate spending category
  category: () =>
    fc.constantFrom("FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"),

  // Generate wallet status
  walletStatus: () =>
    fc.constantFrom("ACTIVE", "SUSPENDED", "EXPIRED", "CLOSED"),

  // Generate coordinates
  latitude: () => fc.double({ min: -90, max: 90 }),
  longitude: () => fc.double({ min: -180, max: 180 }),

  // Generate location
  location: () =>
    fc.record({
      lat: fc.double({ min: -90, max: 90 }),
      lng: fc.double({ min: -180, max: 180 }),
    }),

  // Generate policy snapshot
  policySnapshot: () =>
    fc.record({
      allowedCategories: fc.array(arbitraries.category(), {
        minLength: 1,
        maxLength: 5,
      }),
      maxPerTransaction: fc.integer({ min: 100, max: 10000 }),
      dailyLimit: fc.integer({ min: 500, max: 50000 }),
      weeklyLimit: fc.integer({ min: 2000, max: 200000 }),
      expiresAt: fc.date({
        min: new Date(),
        max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }),
      maxDistanceKm: fc.integer({ min: 10, max: 200 }),
      allowedDistricts: fc.array(fc.string(), { maxLength: 5 }),
    }),

  // Generate validity days
  validityDays: () => fc.integer({ min: 1, max: 365 }),

  // Generate risk score
  riskScore: () => fc.integer({ min: 0, max: 100 }),

  // Generate district name
  district: () =>
    fc.constantFrom("District A", "District B", "District C", "District D"),
};

// Test data generators
export const generators = {
  // Generate beneficiary with status
  beneficiary: (status = "APPROVED") => ({
    _id: new mongoose.Types.ObjectId(),
    status,
    user: new mongoose.Types.ObjectId(),
    name: "Test Beneficiary",
    location: {
      lat: 28.6139,
      lng: 77.209,
    },
  }),

  // Generate campaign with policy
  campaign: (policyOverrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    title: "Test Campaign",
    policySnapshot: {
      allowedCategories: ["FOOD", "MEDICINE", "SHELTER"],
      maxPerTransaction: 1000,
      dailyLimit: 2000,
      weeklyLimit: 5000,
      validityDays: 14,
      ...policyOverrides,
    },
    totalAllocated: 0,
    totalWalletsCreated: 0,
    totalSpent: 0,
  }),

  // Generate merchant
  merchant: (status = "ACTIVE", location = null) => ({
    _id: new mongoose.Types.ObjectId(),
    shopName: "Test Merchant",
    status,
    category: "FOOD",
    location: location || {
      lat: 28.6139,
      lng: 77.209,
      district: "District A",
    },
    pendingBalance: 0,
    totalAidProcessed: 0,
    transactionCount: 0,
  }),

  // Generate wallet
  wallet: (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    beneficiary: new mongoose.Types.ObjectId(),
    campaign: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId(),
    balance: 5000,
    initialAmount: 5000,
    totalSpent: 0,
    dailySpent: 0,
    weeklySpent: 0,
    transactionCount: 0,
    status: "ACTIVE",
    policy: {
      allowedCategories: ["FOOD", "MEDICINE", "SHELTER"],
      maxPerTransaction: 1000,
      dailyLimit: 2000,
      weeklyLimit: 5000,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxDistanceKm: 50,
      allowedDistricts: [],
      allowedMerchants: [],
    },
    transactions: [],
    riskScore: 0,
    fraudFlags: [],
    jobIdHash: "test-hash",
    ...overrides,
  }),
};

// Assertion helpers
export const assertions = {
  // Assert wallet balance consistency
  assertBalanceConsistency: (wallet) => {
    const expectedBalance = wallet.initialAmount - wallet.totalSpent;
    if (wallet.balance !== expectedBalance) {
      throw new Error(
        `Balance inconsistency: balance=${wallet.balance}, expected=${expectedBalance} (initialAmount=${wallet.initialAmount}, totalSpent=${wallet.totalSpent})`,
      );
    }
  },

  // Assert transaction ledger integrity
  assertTransactionLedgerIntegrity: (wallet) => {
    let runningBalance = wallet.initialAmount;
    for (const tx of wallet.transactions) {
      if (tx.type === "DEBIT") {
        runningBalance -= tx.amount;
      } else if (tx.type === "CREDIT") {
        runningBalance += tx.amount;
      } else if (tx.type === "ADJUSTMENT") {
        runningBalance += tx.amount;
      }

      if (Math.abs(tx.balanceAfter - runningBalance) > 0.01) {
        throw new Error(
          `Transaction ledger inconsistency: balanceAfter=${tx.balanceAfter}, expected=${runningBalance}`,
        );
      }
    }
  },

  // Assert risk score bounds
  assertRiskScoreBounds: (riskScore) => {
    if (riskScore < 0 || riskScore > 100) {
      throw new Error(`Risk score out of bounds: ${riskScore}`);
    }
  },
};

// Property test configuration
export const propertyTestConfig = {
  numRuns: 100, // Minimum 100 iterations per property test
  timeout: 10000, // 10 second timeout
};

export default {
  arbitraries,
  generators,
  assertions,
  propertyTestConfig,
};
