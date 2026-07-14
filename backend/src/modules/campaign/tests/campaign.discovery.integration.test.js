import { describe, it, before, after, beforeEach } from "mocha";
import { expect } from "chai";
import supertest from "supertest";
import app from "../../../app.js";
import { Campaign } from "../../../models/ngo/Campaign.model.js";
import { User } from "../../../models/auth/User.model.js";
import { Donation } from "../../../models/donor/Donation.model.js";
import { connectDB, disconnectDB } from "../../../config/database.config.js";
import { redisConnection } from "../../../config/redis.config.js";

const request = supertest(app);

/**
 * Integration Tests for Campaign Discovery System
 *
 * Tests end-to-end campaign discovery workflow:
 * - Filter → Sort → View → Donate
 * - Trust Engine integration with real campaign data
 * - Database aggregation pipelines with various filter combinations
 * - Cache invalidation scenarios across service boundaries
 * - API integration tests for all discovery endpoints
 */

describe("Campaign Discovery System - Integration Tests", function () {
  this.timeout(60000);

  let testNGO;
  let testDonor;
  let testCampaigns = [];
  let authToken;

  before(async function () {
    await connectDB();

    // Clean up any existing test data
    await Campaign.deleteMany({ title: { $regex: /^INTEGRATION_TEST_/ } });
    await User.deleteMany({
      email: { $regex: /^integration_test_.*@test\.com$/ },
    });
    await Donation.deleteMany({ amount: 99999 }); // Test donation amount

    // Clear Redis cache
    try {
      await redisConnection.flushdb();
    } catch (error) {
      console.warn("Redis not available for integration tests");
    }
  });

  after(async function () {
    // Clean up test data
    await Campaign.deleteMany({ title: { $regex: /^INTEGRATION_TEST_/ } });
    await User.deleteMany({
      email: { $regex: /^integration_test_.*@test\.com$/ },
    });
    await Donation.deleteMany({ amount: 99999 });
    await disconnectDB();
  });

  beforeEach(async function () {
    // Create test NGO
    testNGO = await User.create({
      email: "integration_test_ngo@test.com",
      name: "Integration Test NGO",
      role: "NGO",
      verificationStatus: "APPROVED",
      password: "hashedpassword123",
    });

    // Create test donor
    testDonor = await User.create({
      email: "integration_test_donor@test.com",
      name: "Integration Test Donor",
      role: "DONOR",
      password: "hashedpassword123",
    });

    // Create diverse test campaigns
    testCampaigns = await Promise.all([
      // High trust, flood campaign
      Campaign.create({
        title: "INTEGRATION_TEST_Flood_Relief_Mumbai",
        description: "Emergency flood relief for Mumbai residents",
        disasterType: "FLOOD",
        targetAmount: 500000,
        totalDonated: 250000,
        location: { state: "Maharashtra", district: "Mumbai", ward: "Bandra" },
        status: "ACTIVE",
        trustScore: 85,
        transparencyScore: 90,
        proofCount: 15,
        proofVerifiedCount: 12,
        createdBy: testNGO._id,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),

      // Medium trust, earthquake campaign
      Campaign.create({
        title: "INTEGRATION_TEST_Earthquake_Recovery_Delhi",
        description: "Earthquake recovery support for Delhi area",
        disasterType: "EARTHQUAKE",
        targetAmount: 300000,
        totalDonated: 100000,
        location: {
          state: "Delhi",
          district: "New Delhi",
          ward: "Central Delhi",
        },
        status: "ACTIVE",
        trustScore: 65,
        transparencyScore: 70,
        proofCount: 8,
        proofVerifiedCount: 5,
        createdBy: testNGO._id,
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      }),

      // Low trust, famine campaign
      Campaign.create({
        title: "INTEGRATION_TEST_Famine_Aid_Rajasthan",
        description: "Famine relief efforts in rural Rajasthan",
        disasterType: "FAMINE",
        targetAmount: 200000,
        totalDonated: 50000,
        location: {
          state: "Rajasthan",
          district: "Jaipur",
          ward: "Rural Area",
        },
        status: "ACTIVE",
        trustScore: 45,
        transparencyScore: 50,
        proofCount: 3,
        proofVerifiedCount: 1,
        createdBy: testNGO._id,
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      }),

      // Inactive campaign (should not appear in results)
      Campaign.create({
        title: "INTEGRATION_TEST_Inactive_Campaign",
        description: "This campaign should not appear in discovery results",
        disasterType: "OTHER",
        targetAmount: 100000,
        totalDonated: 0,
        location: { state: "Test State", district: "Test District" },
        status: "INACTIVE",
        trustScore: 80,
        createdBy: testNGO._id,
      }),
    ]);

    // Generate auth token for donor
    authToken = "test-auth-token"; // In real tests, generate proper JWT
  });

  /**
   * Test 1: End-to-End Campaign Discovery Workflow
   * Filter → Sort → View → Donate
   */
  describe("End-to-End Discovery Workflow", function () {
    it("should complete full discovery to donation workflow", async function () {
      // Step 1: Discover campaigns with filters
      const discoveryResponse = await request
        .get("/api/campaigns/discover")
        .query({
          disasterType: "FLOOD",
          trustScoreMin: 80,
          sort: "highest_trust",
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(discoveryResponse.body.success).to.be.true;
      expect(discoveryResponse.body.data.campaigns).to.be.an("array");

      // Should find the high-trust flood campaign
      const floodCampaigns = discoveryResponse.body.data.campaigns.filter((c) =>
        c.title.includes("INTEGRATION_TEST_Flood"),
      );
      expect(floodCampaigns).to.have.lengthOf(1);

      const selectedCampaign = floodCampaigns[0];
      expect(selectedCampaign.disasterType).to.equal("FLOOD");
      expect(selectedCampaign.trustScore).to.be.at.least(80);

      // Step 2: View campaign details
      const campaignDetailsResponse = await request
        .get(`/api/campaigns/${selectedCampaign._id}`)
        .expect(200);

      expect(campaignDetailsResponse.body.success).to.be.true;
      expect(campaignDetailsResponse.body.data.title).to.include(
        "Flood_Relief_Mumbai",
      );

      // Step 3: Initiate donation (simulate donation workflow)
      const donationData = {
        campaignId: selectedCampaign._id,
        amount: 99999, // Test amount for easy cleanup
        donorId: testDonor._id,
      };

      const donationResponse = await request
        .post("/api/donations")
        .send(donationData)
        .expect(201);

      expect(donationResponse.body.success).to.be.true;
      expect(donationResponse.body.data.campaignId).to.equal(
        selectedCampaign._id,
      );
      expect(donationResponse.body.data.amount).to.equal(99999);
    });

    it("should handle complex filter combinations", async function () {
      const response = await request
        .get("/api/campaigns/discover")
        .query({
          disasterType: ["FLOOD", "EARTHQUAKE"],
          trustScoreMin: 60,
          trustScoreMax: 90,
          fundingProgressMin: 20,
          fundingProgressMax: 80,
          location: "Delhi",
          sort: "most_funded",
        })
        .expect(200);

      expect(response.body.success).to.be.true;

      const campaigns = response.body.data.campaigns.filter((c) =>
        c.title.includes("INTEGRATION_TEST"),
      );

      // Should find campaigns matching all criteria
      campaigns.forEach((campaign) => {
        expect(["FLOOD", "EARTHQUAKE"]).to.include(campaign.disasterType);
        if (campaign.trustScore !== null) {
          expect(campaign.trustScore).to.be.at.least(60);
          expect(campaign.trustScore).to.be.at.most(90);
        }

        // Check funding progress
        const fundingProgress =
          (campaign.totalDonated / campaign.targetAmount) * 100;
        expect(fundingProgress).to.be.at.least(20);
        expect(fundingProgress).to.be.at.most(80);
      });
    });
  });

  /**
   * Test 2: Trust Engine Integration with Real Campaign Data
   */
  describe("Trust Engine Integration", function () {
    it("should integrate trust scores with campaign discovery", async function () {
      const response = await request
        .get("/api/campaigns/discover")
        .query({
          sort: "highest_trust",
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).to.be.true;

      const testCampaigns = response.body.data.campaigns.filter((c) =>
        c.title.includes("INTEGRATION_TEST"),
      );

      // Should return campaigns sorted by trust score
      for (let i = 1; i < testCampaigns.length; i++) {
        if (
          testCampaigns[i].trustScore !== null &&
          testCampaigns[i - 1].trustScore !== null
        ) {
          expect(testCampaigns[i].trustScore).to.be.at.most(
            testCampaigns[i - 1].trustScore,
          );
        }
      }

      // Trust scores should be in valid range
      testCampaigns.forEach((campaign) => {
        if (campaign.trustScore !== null) {
          expect(campaign.trustScore).to.be.at.least(0);
          expect(campaign.trustScore).to.be.at.most(100);
        }
      });
    });

    it("should handle trust score unavailability gracefully", async function () {
      // Create campaign without trust score
      const campaignWithoutTrust = await Campaign.create({
        title: "INTEGRATION_TEST_No_Trust_Score",
        description: "Campaign without trust score",
        disasterType: "OTHER",
        targetAmount: 100000,
        totalDonated: 0,
        location: { state: "Test", district: "Test" },
        status: "ACTIVE",
        trustScore: null,
        createdBy: testNGO._id,
      });

      const response = await request
        .get("/api/campaigns/discover")
        .query({ sort: "highest_trust" })
        .expect(200);

      expect(response.body.success).to.be.true;

      const campaignInResults = response.body.data.campaigns.find(
        (c) => c.title === "INTEGRATION_TEST_No_Trust_Score",
      );

      if (campaignInResults) {
        expect(campaignInResults.trustScore).to.be.null;
        expect(campaignInResults.trustScoreStatus).to.equal("PENDING");
      }

      // Cleanup
      await Campaign.deleteOne({ _id: campaignWithoutTrust._id });
    });
  });

  /**
   * Test 3: Database Aggregation Pipeline Performance
   */
  describe("Database Aggregation Performance", function () {
    it("should execute complex aggregation pipelines efficiently", async function () {
      const startTime = Date.now();

      const response = await request
        .get("/api/campaigns/discover")
        .query({
          disasterType: ["FLOOD", "EARTHQUAKE", "FAMINE"],
          trustScoreMin: 40,
          trustScoreMax: 90,
          fundingProgressMin: 10,
          fundingProgressMax: 90,
          location: "a", // Broad search term
          sort: "recommended",
          limit: 50,
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Should complete within performance target (500ms)
      expect(responseTime).to.be.below(500);
      expect(response.body.success).to.be.true;
      expect(response.body.data.performance.responseTime).to.be.below(500);
    });

    it("should handle pagination efficiently", async function () {
      // Test multiple pages
      const page1Response = await request
        .get("/api/campaigns/discover")
        .query({ page: 1, limit: 2 })
        .expect(200);

      const page2Response = await request
        .get("/api/campaigns/discover")
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(page1Response.body.success).to.be.true;
      expect(page2Response.body.success).to.be.true;

      // Pages should have different campaigns (if enough campaigns exist)
      const page1Ids = page1Response.body.data.campaigns.map((c) => c._id);
      const page2Ids = page2Response.body.data.campaigns.map((c) => c._id);

      // No overlap between pages
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).to.have.lengthOf(0);
    });
  });

  /**
   * Test 4: Cache Invalidation Scenarios
   */
  describe("Cache Invalidation", function () {
    it("should invalidate cache when campaign is updated", async function () {
      // First request - should cache results
      const response1 = await request
        .get("/api/campaigns/discover")
        .query({ sort: "recent", limit: 10 })
        .expect(200);

      expect(response1.body.success).to.be.true;
      const initialCacheHit =
        response1.body.data.performance?.cacheHit || false;

      // Update a campaign
      await Campaign.findByIdAndUpdate(testCampaigns[0]._id, {
        totalDonated: testCampaigns[0].totalDonated + 10000,
      });

      // Invalidate cache
      await request
        .post("/api/campaigns/invalidate-cache")
        .send({ campaignId: testCampaigns[0]._id })
        .expect(200);

      // Second request - should not use cache
      const response2 = await request
        .get("/api/campaigns/discover")
        .query({ sort: "recent", limit: 10 })
        .expect(200);

      expect(response2.body.success).to.be.true;

      // Should reflect updated data
      const updatedCampaign = response2.body.data.campaigns.find(
        (c) => c._id === testCampaigns[0]._id.toString(),
      );

      if (updatedCampaign) {
        expect(updatedCampaign.totalDonated).to.equal(
          testCampaigns[0].totalDonated + 10000,
        );
      }
    });
  });

  /**
   * Test 5: API Integration Tests for All Discovery Endpoints
   */
  describe("API Endpoint Integration", function () {
    it("should handle discovery statistics endpoint", async function () {
      const response = await request
        .get("/api/campaigns/discover/stats")
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property("totalActiveCampaigns");
      expect(response.body.data).to.have.property("campaignsByType");
      expect(response.body.data).to.have.property("averageTrustScore");
      expect(response.body.data).to.have.property("totalFunding");

      expect(response.body.data.totalActiveCampaigns).to.be.a("number");
      expect(response.body.data.totalActiveCampaigns).to.be.at.least(3); // Our test campaigns
    });

    it("should handle performance metrics endpoint", async function () {
      const response = await request
        .get("/api/campaigns/discover/performance")
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property("totalRequests");
      expect(response.body.data).to.have.property("cacheHitRatio");
      expect(response.body.data).to.have.property("averageResponseTime");
      expect(response.body.data).to.have.property("performanceTarget");

      expect(response.body.data.performanceTarget).to.equal(500);
    });

    it("should handle recommendation endpoint", async function () {
      const response = await request
        .get(`/api/campaigns/recommend/${testDonor._id}`)
        .query({
          minTrustScore: 60,
          limit: 5,
        })
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property("campaigns");

      if (response.body.data.campaigns.length > 0) {
        response.body.data.campaigns.forEach((campaign) => {
          if (campaign.trustScore !== null) {
            expect(campaign.trustScore).to.be.at.least(60);
          }
        });
      }
    });

    it("should handle donor profile endpoint", async function () {
      const response = await request
        .get(`/api/campaigns/donor-profile/${testDonor._id}`)
        .expect(200);

      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property("profile");
      expect(response.body.data).to.have.property("insights");

      expect(response.body.data.insights).to.have.property("isNewDonor");
      expect(response.body.data.insights).to.have.property(
        "recommendedMinTrust",
      );
    });
  });

  /**
   * Test 6: Error Handling Across Service Boundaries
   */
  describe("Error Handling Integration", function () {
    it("should handle invalid campaign ID gracefully", async function () {
      const response = await request
        .get("/api/campaigns/invalid-campaign-id")
        .expect(404);

      expect(response.body.success).to.be.false;
      expect(response.body.message).to.include("not found");
    });

    it("should handle invalid filter parameters", async function () {
      const response = await request
        .get("/api/campaigns/discover")
        .query({
          trustScoreMin: "invalid",
          page: -1,
          limit: 1000,
        })
        .expect(200); // Should handle gracefully, not error

      expect(response.body.success).to.be.true;

      // Should apply default/corrected values
      expect(response.body.data.pagination.page).to.be.at.least(1);
      expect(response.body.data.pagination.limit).to.be.at.most(50);
    });

    it("should handle database connection issues gracefully", async function () {
      // This test would require mocking database failures
      // For now, we test that the service handles errors without crashing

      const response = await request
        .get("/api/campaigns/discover")
        .query({ sort: "recent" })
        .expect(200);

      expect(response.body.success).to.be.true;
    });
  });
});
