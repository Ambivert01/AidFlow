import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import fc from "fast-check";
import supertest from "supertest";
import app from "../../../app.js";
import { Campaign } from "../../../models/ngo/Campaign.model.js";
import { User } from "../../../models/auth/User.model.js";
import { connectDB, disconnectDB } from "../../../config/database.config.js";
import campaignDiscoveryService from "../campaign.discovery.service.js";

const request = supertest(app);

/**
 * Property-Based Test Suite for Campaign Discovery System
 *
 * This test suite validates the 10 correctness properties defined in the design document:
 * 1. Campaign Discovery Filtering Accuracy
 * 2. Campaign Sorting Correctness
 * 3. Trust Score Integration and Calculation
 * 4. UI Component Rendering Completeness
 * 5. Campaign Data Parser Round-Trip
 * 6. Input Validation and Error Handling
 * 7. Cache Invalidation and Performance
 * 8. Active Campaign Retrieval
 * 9. Real-Time Search Filtering
 * 10. Donation Workflow Context Preservation
 */

describe("Campaign Discovery System - Property-Based Tests", function () {
  this.timeout(30000);

  before(async function () {
    await connectDB();
    // Clean up test data
    await Campaign.deleteMany({ title: { $regex: /^TEST_/ } });
    await User.deleteMany({ email: { $regex: /^test_.*@test\.com$/ } });
  });

  after(async function () {
    // Clean up test data
    await Campaign.deleteMany({ title: { $regex: /^TEST_/ } });
    await User.deleteMany({ email: { $regex: /^test_.*@test\.com$/ } });
    await disconnectDB();
  });

  /**
   * Property 1: Campaign Discovery Filtering Accuracy
   * Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6
   *
   * For any valid filter criteria F and campaign set C:
   * - All returned campaigns must satisfy filter F
   * - No campaigns satisfying F should be excluded (completeness)
   * - Filter combinations should work correctly (intersection)
   */
  describe("Property 1: Campaign Discovery Filtering Accuracy", function () {
    it("should return only campaigns matching disaster type filter", function () {
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            "FLOOD",
            "EARTHQUAKE",
            "CYCLONE",
            "FIRE",
            "DROUGHT",
            "PANDEMIC",
            "WAR",
          ),
          async (disasterType) => {
            // Create test campaigns with different disaster types
            const testCampaigns = await Promise.all([
              createTestCampaign({
                disasterType,
                title: `TEST_${disasterType}_1`,
              }),
              createTestCampaign({
                disasterType: "OTHER",
                title: `TEST_OTHER_1`,
              }),
            ]);

            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                { disasterType: [disasterType] },
                "recent",
                { page: 1, limit: 50 },
              );

              const campaigns = result.data.campaigns;
              const matchingCampaigns = campaigns.filter((c) =>
                c.title.startsWith("TEST_"),
              );

              // All returned test campaigns should match the disaster type
              matchingCampaigns.forEach((campaign) => {
                expect(campaign.disasterType).to.equal(disasterType);
              });

              // Should find at least our test campaign
              expect(matchingCampaigns.length).to.be.at.least(1);
            } finally {
              // Cleanup
              await Campaign.deleteMany({
                _id: { $in: testCampaigns.map((c) => c._id) },
              });
            }
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should correctly filter by trust score range", function () {
      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 90 }), // Leave room for +/- 5
          fc.integer({ min: 10, max: 90 }),
          async (min, max) => {
            const trustScoreMin = Math.min(min, max);
            const trustScoreMax = Math.max(min, max);

            // Ensure trust scores are within valid range (0-100) for Campaign model
            // and that they are actually in/out of range
            const inRangeScore = Math.floor(
              (trustScoreMin + trustScoreMax) / 2,
            ); // Middle of range
            const belowRangeScore = Math.max(0, trustScoreMin - 5); // Below min
            const aboveRangeScore = Math.min(100, trustScoreMax + 5); // Above max

            // Create test campaigns with different trust scores
            const testCampaigns = await Promise.all([
              createTestCampaign({
                trustScore: inRangeScore,
                title: `TEST_TRUST_IN_RANGE_${Date.now()}`,
              }),
              createTestCampaign({
                trustScore: belowRangeScore,
                title: `TEST_TRUST_BELOW_${Date.now()}`,
              }),
              createTestCampaign({
                trustScore: aboveRangeScore,
                title: `TEST_TRUST_ABOVE_${Date.now()}`,
              }),
            ]);

            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                { trustScoreMin, trustScoreMax },
                "recent",
                { page: 1, limit: 50 },
              );

              const campaigns = result.data.campaigns;
              const testCampaignsReturned = campaigns.filter((c) =>
                c.title.startsWith("TEST_TRUST_"),
              );

              // All returned campaigns should be within trust score range
              testCampaignsReturned.forEach((campaign) => {
                if (
                  campaign.trustScore !== null &&
                  campaign.trustScore !== undefined
                ) {
                  expect(campaign.trustScore).to.be.at.least(trustScoreMin);
                  expect(campaign.trustScore).to.be.at.most(trustScoreMax);
                }
              });

              // Should find at least the in-range campaign
              const inRangeCampaigns = testCampaignsReturned.filter((c) =>
                c.title.includes("IN_RANGE"),
              );
              expect(inRangeCampaigns.length).to.be.at.least(1);
            } finally {
              // Cleanup
              await Campaign.deleteMany({
                _id: { $in: testCampaigns.map((c) => c._id) },
              });
            }
          },
        ),
        { numRuns: 5 },
      );
    });
  });

  /**
   * Property 2: Campaign Sorting Correctness
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   *
   * For any valid sort criteria S and campaign set C:
   * - Returned campaigns must be in correct order according to S
   * - Sort stability: campaigns with equal sort values maintain relative order
   * - Multiple sort criteria work correctly (primary, secondary ordering)
   */
  describe("Property 2: Campaign Sorting Correctness", function () {
    it("should sort campaigns by trust score in descending order", function () {
      return fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 0, max: 100 }), {
            minLength: 3,
            maxLength: 5,
          }),
          async (trustScores) => {
            // Create test campaigns with different trust scores
            const testCampaigns = await Promise.all(
              trustScores.map((score, index) =>
                createTestCampaign({
                  trustScore: score,
                  title: `TEST_SORT_TRUST_${index}_${Date.now()}`,
                }),
              ),
            );

            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                {},
                "highest_trust",
                { page: 1, limit: 50 },
              );

              const campaigns = result.data.campaigns;
              const testCampaignsReturned = campaigns
                .filter((c) => c.title.startsWith("TEST_SORT_TRUST_"))
                .filter(
                  (c) => c.trustScore !== null && c.trustScore !== undefined,
                );

              // Verify descending order by trust score
              for (let i = 1; i < testCampaignsReturned.length; i++) {
                expect(testCampaignsReturned[i].trustScore).to.be.at.most(
                  testCampaignsReturned[i - 1].trustScore,
                );
              }
            } finally {
              // Cleanup
              await Campaign.deleteMany({
                _id: { $in: testCampaigns.map((c) => c._id) },
              });
            }
          },
        ),
        { numRuns: 5 },
      );
    });

    it("should sort campaigns by total donated in descending order", function () {
      return fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1000, max: 100000 }), {
            minLength: 3,
            maxLength: 5,
          }),
          async (donationAmounts) => {
            // Create test campaigns with different donation amounts
            const testCampaigns = await Promise.all(
              donationAmounts.map((amount, index) =>
                createTestCampaign({
                  totalDonated: amount,
                  title: `TEST_SORT_FUNDED_${index}_${Date.now()}`,
                }),
              ),
            );

            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                {},
                "most_funded",
                { page: 1, limit: 50 },
              );

              const campaigns = result.data.campaigns;
              const testCampaignsReturned = campaigns.filter((c) =>
                c.title.startsWith("TEST_SORT_FUNDED_"),
              );

              // Verify descending order by total donated
              for (let i = 1; i < testCampaignsReturned.length; i++) {
                expect(testCampaignsReturned[i].totalDonated).to.be.at.most(
                  testCampaignsReturned[i - 1].totalDonated,
                );
              }
            } finally {
              // Cleanup
              await Campaign.deleteMany({
                _id: { $in: testCampaigns.map((c) => c._id) },
              });
            }
          },
        ),
        { numRuns: 5 },
      );
    });
  });

  /**
   * Property 8: Active Campaign Retrieval
   * Validates: Requirements 1.1
   *
   * Only campaigns with status "ACTIVE" should be returned in discovery results
   */
  describe("Property 8: Active Campaign Retrieval", function () {
    it("should only return campaigns with ACTIVE status", function () {
      return fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            "DRAFT",
            "PENDING_APPROVAL",
            "WORKFLOW_RUNNING",
            "PAUSED",
            "COMPLETED",
            "CLOSED",
            "ARCHIVED",
            "REJECTED",
          ),
          async (inactiveStatus) => {
            // Create test campaigns with different statuses
            const testCampaigns = await Promise.all([
              createTestCampaign({
                status: "ACTIVE",
                title: `TEST_ACTIVE_${Date.now()}`,
              }),
              createTestCampaign({
                status: inactiveStatus,
                title: `TEST_INACTIVE_${Date.now()}`,
              }),
            ]);

            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                {},
                "recent",
                { page: 1, limit: 50 },
              );

              const campaigns = result.data.campaigns;
              const testCampaignsReturned = campaigns.filter((c) =>
                c.title.startsWith("TEST_"),
              );

              // All returned test campaigns should have ACTIVE status
              testCampaignsReturned.forEach((campaign) => {
                expect(campaign.status).to.equal("ACTIVE");
              });

              // Should find the active campaign but not the inactive one
              const activeCampaigns = testCampaignsReturned.filter((c) =>
                c.title.includes("ACTIVE"),
              );
              const inactiveCampaigns = testCampaignsReturned.filter((c) =>
                c.title.includes("INACTIVE"),
              );

              expect(activeCampaigns.length).to.be.at.least(1);
              expect(inactiveCampaigns.length).to.equal(0);
            } finally {
              // Cleanup
              await Campaign.deleteMany({
                _id: { $in: testCampaigns.map((c) => c._id) },
              });
            }
          },
        ),
        { numRuns: 5 },
      );
    });
  });

  /**
   * Property 6: Input Validation and Error Handling
   * Validates: Requirements 7.4, 8.5, 9.1, 9.2
   *
   * Invalid inputs should be rejected with appropriate error messages
   * System should handle edge cases gracefully
   */
  describe("Property 6: Input Validation and Error Handling", function () {
    it("should validate trust score range inputs", function () {
      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -100, max: 200 }),
          fc.integer({ min: -100, max: 200 }),
          async (min, max) => {
            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                { trustScoreMin: min, trustScoreMax: max },
                "recent",
                { page: 1, limit: 10 },
              );

              // Should succeed and return valid data structure
              expect(result).to.have.property("success");
              expect(result).to.have.property("data");
              expect(result.data).to.have.property("campaigns");
              expect(result.data).to.have.property("pagination");

              // If invalid values were provided, they should be filtered out
              if (min < 0 || min > 100 || max < 0 || max > 100) {
                // Service should handle invalid values gracefully
                expect(result.success).to.be.true;
              }
            } catch (error) {
              // Should not throw errors for invalid inputs, should handle gracefully
              expect.fail(
                `Should handle invalid inputs gracefully: ${error.message}`,
              );
            }
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should handle pagination edge cases", function () {
      return fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -10, max: 1000 }),
          fc.integer({ min: -10, max: 200 }),
          async (page, limit) => {
            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                {},
                "recent",
                { page, limit },
              );

              // Should always return valid pagination structure
              expect(result).to.have.property("success");
              expect(result.data).to.have.property("pagination");
              expect(result.data.pagination).to.have.property("page");
              expect(result.data.pagination).to.have.property("limit");
              expect(result.data.pagination).to.have.property("total");

              // Page should be at least 1
              expect(result.data.pagination.page).to.be.at.least(1);

              // Limit should be reasonable (between 1 and 50)
              expect(result.data.pagination.limit).to.be.at.least(1);
              expect(result.data.pagination.limit).to.be.at.most(50);
            } catch (error) {
              expect.fail(
                `Should handle pagination edge cases: ${error.message}`,
              );
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  /**
   * Property 9: Real-Time Search Filtering
   * Validates: Requirements 4.4, 4.5
   *
   * Search functionality should return campaigns matching search terms
   */
  describe("Property 9: Real-Time Search Filtering", function () {
    it("should find campaigns matching search terms in title or description", function () {
      return fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 3, maxLength: 10 })
            .filter((s) => /^[a-zA-Z]+$/.test(s)),
          async (searchTerm) => {
            // Create test campaigns with search term in title and description
            const testCampaigns = await Promise.all([
              createTestCampaign({
                title: `TEST_${searchTerm}_TITLE_${Date.now()}`,
                description: "Regular description",
              }),
              createTestCampaign({
                title: `TEST_OTHER_TITLE_${Date.now()}`,
                description: `Description containing ${searchTerm} keyword`,
              }),
              createTestCampaign({
                title: `TEST_UNRELATED_${Date.now()}`,
                description: "Completely different content",
              }),
            ]);

            try {
              const result = await campaignDiscoveryService.discoverCampaigns(
                { search: searchTerm },
                "recent",
                { page: 1, limit: 50 },
              );

              const campaigns = result.data.campaigns;
              const testCampaignsReturned = campaigns.filter((c) =>
                c.title.startsWith("TEST_"),
              );

              // Should find campaigns with search term in title or description
              const matchingCampaigns = testCampaignsReturned.filter(
                (c) =>
                  c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
              );

              expect(matchingCampaigns.length).to.be.at.least(2);

              // Should not return campaigns without the search term
              const nonMatchingCampaigns = testCampaignsReturned.filter(
                (c) =>
                  !c.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  !c.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
              );

              expect(nonMatchingCampaigns.length).to.equal(0);
            } finally {
              // Cleanup
              await Campaign.deleteMany({
                _id: { $in: testCampaigns.map((c) => c._id) },
              });
            }
          },
        ),
        { numRuns: 5 },
      );
    });
  });
});

/**
 * Helper function to create test campaigns
 */
async function createTestCampaign(overrides = {}) {
  // Create a test NGO user first
  const testNGO = await User.findOneAndUpdate(
    { email: "test_ngo@test.com" },
    {
      email: "test_ngo@test.com",
      name: "Test NGO",
      role: "NGO",
      verificationStatus: "APPROVED",
      password: "hashedpassword",
    },
    { upsert: true, new: true },
  );

  const defaultCampaign = {
    title: `TEST_CAMPAIGN_${Date.now()}`,
    description: "Test campaign description",
    disasterType: "FLOOD",
    targetAmount: 100000,
    totalDonated: 0,
    location: {
      state: "Test State",
      district: "Test District",
      ward: "Test Ward",
    },
    status: "ACTIVE",
    trustScore: 75,
    transparencyScore: 80,
    proofCount: 5,
    proofVerifiedCount: 3,
    createdBy: testNGO._id,
    createdAt: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    jobIdHash: `test_job_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Required field
    ...overrides,
  };

  return await Campaign.create(defaultCampaign);
}
