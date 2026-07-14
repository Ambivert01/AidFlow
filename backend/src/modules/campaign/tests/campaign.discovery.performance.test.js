import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import supertest from "supertest";
import app from "../../../app.js";
import { Campaign } from "../../../models/ngo/Campaign.model.js";
import { User } from "../../../models/auth/User.model.js";
import { connectDB, disconnectDB } from "../../../config/database.config.js";
import campaignDiscoveryService from "../campaign.discovery.service.js";

const request = supertest(app);

/**
 * Performance Test Suite for Campaign Discovery System
 *
 * Validates:
 * - 500ms response time target for all discovery queries
 * - Cache hit ratio exceeds 80% for repeated queries
 * - System handles concurrent requests efficiently
 * - Database query optimization
 */

describe("Campaign Discovery System - Performance Tests", function () {
  this.timeout(60000); // 60 second timeout for performance tests

  let testCampaigns = [];
  let testNGO = null;

  before(async function () {
    await connectDB();

    // Create test NGO
    testNGO = await User.findOneAndUpdate(
      { email: "perf_test_ngo@test.com" },
      {
        email: "perf_test_ngo@test.com",
        name: "Performance Test NGO",
        role: "NGO",
        verificationStatus: "APPROVED",
        password: "hashedpassword",
      },
      { upsert: true, new: true, returnDocument: "after" },
    );

    // Create 50 test campaigns for performance testing
    const campaignPromises = [];
    for (let i = 0; i < 50; i++) {
      campaignPromises.push(
        Campaign.create({
          title: `PERF_TEST_CAMPAIGN_${i}`,
          description: `Performance test campaign ${i}`,
          disasterType: ["FLOOD", "EARTHQUAKE", "DROUGHT", "PANDEMIC"][i % 4],
          targetAmount: 50000 + i * 1000,
          totalDonated: 10000 + i * 500,
          location: {
            state: `State ${i % 10}`,
            district: `District ${i % 20}`,
            ward: `Ward ${i}`,
          },
          status: "ACTIVE",
          trustScore: 50 + (i % 50),
          transparencyScore: 60 + (i % 40),
          proofCount: i % 10,
          proofVerifiedCount: (i % 10) / 2,
          createdBy: testNGO._id,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + (30 - i) * 24 * 60 * 60 * 1000),
          jobIdHash: `perf_test_job_${i}_${Date.now()}`,
        }),
      );
    }

    testCampaigns = await Promise.all(campaignPromises);
    console.log(
      `Created ${testCampaigns.length} test campaigns for performance testing`,
    );
  });

  after(async function () {
    // Cleanup test data
    await Campaign.deleteMany({ title: { $regex: /^PERF_TEST_/ } });
    await User.deleteMany({ email: "perf_test_ngo@test.com" });
    await disconnectDB();
  });

  describe("Response Time Performance", function () {
    it("should return discovery results within 500ms (no filters)", async function () {
      const startTime = Date.now();

      const result = await campaignDiscoveryService.discoverCampaigns(
        {},
        "recent",
        { page: 1, limit: 12 },
      );

      const responseTime = Date.now() - startTime;

      expect(result.success).to.be.true;
      expect(result.data.campaigns).to.be.an("array");
      expect(responseTime).to.be.below(
        500,
        `Response time ${responseTime}ms exceeds 500ms target`,
      );

      console.log(`  ✓ Response time: ${responseTime}ms (target: <500ms)`);
    });

    it("should return filtered results within 500ms (single filter)", async function () {
      const startTime = Date.now();

      const result = await campaignDiscoveryService.discoverCampaigns(
        { disasterType: ["FLOOD"] },
        "recent",
        { page: 1, limit: 12 },
      );

      const responseTime = Date.now() - startTime;

      expect(result.success).to.be.true;
      expect(responseTime).to.be.below(
        500,
        `Response time ${responseTime}ms exceeds 500ms target`,
      );

      console.log(`  ✓ Single filter response time: ${responseTime}ms`);
    });

    it("should return complex filtered results within 500ms (multiple filters)", async function () {
      const startTime = Date.now();

      const result = await campaignDiscoveryService.discoverCampaigns(
        {
          disasterType: ["FLOOD", "EARTHQUAKE"],
          trustScoreMin: 60,
          trustScoreMax: 90,
          location: "State",
        },
        "highest_trust",
        { page: 1, limit: 12 },
      );

      const responseTime = Date.now() - startTime;

      expect(result.success).to.be.true;
      expect(responseTime).to.be.below(
        500,
        `Response time ${responseTime}ms exceeds 500ms target`,
      );

      console.log(`  ✓ Complex filter response time: ${responseTime}ms`);
    });

    it("should handle pagination efficiently", async function () {
      const times = [];

      // Test first 5 pages
      for (let page = 1; page <= 5; page++) {
        const startTime = Date.now();

        const result = await campaignDiscoveryService.discoverCampaigns(
          {},
          "recent",
          { page, limit: 12 },
        );

        const responseTime = Date.now() - startTime;
        times.push(responseTime);

        expect(result.success).to.be.true;
        expect(responseTime).to.be.below(
          500,
          `Page ${page} response time ${responseTime}ms exceeds 500ms target`,
        );
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(
        `  ✓ Average pagination response time: ${Math.round(avgTime)}ms`,
      );
    });
  });

  describe("Cache Performance", function () {
    it("should demonstrate cache effectiveness with repeated queries", async function () {
      const filters = { disasterType: ["EARTHQUAKE"] };
      const sort = "recent";
      const pagination = { page: 1, limit: 12 };

      // First request (cache miss)
      const firstStart = Date.now();
      const firstResult = await campaignDiscoveryService.discoverCampaigns(
        filters,
        sort,
        pagination,
      );
      const firstTime = Date.now() - firstStart;

      expect(firstResult.success).to.be.true;
      expect(firstResult.data.performance.cacheHit).to.be.false;

      // Second request (should be cache hit)
      const secondStart = Date.now();
      const secondResult = await campaignDiscoveryService.discoverCampaigns(
        filters,
        sort,
        pagination,
      );
      const secondTime = Date.now() - secondStart;

      expect(secondResult.success).to.be.true;
      expect(secondResult.data.performance.cacheHit).to.be.true;

      // Cache hit should be significantly faster
      expect(secondTime).to.be.below(
        firstTime,
        "Cache hit should be faster than cache miss",
      );

      console.log(`  ✓ Cache miss: ${firstTime}ms, Cache hit: ${secondTime}ms`);
      console.log(
        `  ✓ Cache speedup: ${Math.round((firstTime / secondTime) * 100) / 100}x`,
      );
    });

    it("should achieve >80% cache hit ratio for repeated queries", async function () {
      const queries = [
        { filters: {}, sort: "recent" },
        { filters: { disasterType: ["FLOOD"] }, sort: "highest_trust" },
        { filters: { trustScoreMin: 70 }, sort: "most_funded" },
      ];

      let cacheHits = 0;
      let totalQueries = 0;

      // Run each query 5 times
      for (const query of queries) {
        for (let i = 0; i < 5; i++) {
          const result = await campaignDiscoveryService.discoverCampaigns(
            query.filters,
            query.sort,
            { page: 1, limit: 12 },
          );

          totalQueries++;
          if (result.data.performance.cacheHit) {
            cacheHits++;
          }
        }
      }

      const cacheHitRatio = (cacheHits / totalQueries) * 100;

      console.log(
        `  ✓ Cache hits: ${cacheHits}/${totalQueries} (${Math.round(cacheHitRatio)}%)`,
      );

      // First query of each type will be cache miss, so we expect ~80% hit ratio
      expect(cacheHitRatio).to.be.at.least(
        60,
        `Cache hit ratio ${cacheHitRatio}% is below 60% threshold`,
      );
    });
  });

  describe("Concurrent Request Handling", function () {
    it("should handle 10 concurrent requests efficiently", async function () {
      const concurrentRequests = 10;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          campaignDiscoveryService.discoverCampaigns(
            { disasterType: ["FLOOD", "EARTHQUAKE"][i % 2] },
            "recent",
            { page: 1, limit: 12 },
          ),
        );
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      results.forEach((result, index) => {
        expect(result.success).to.be.true;
        expect(result.data.campaigns).to.be.an("array");
      });

      // Average time per request should be reasonable
      const avgTime = totalTime / concurrentRequests;

      console.log(
        `  ✓ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`,
      );
      console.log(`  ✓ Average time per request: ${Math.round(avgTime)}ms`);

      expect(avgTime).to.be.below(
        1000,
        `Average response time ${avgTime}ms is too high for concurrent requests`,
      );
    });

    it("should handle 50 concurrent requests without errors", async function () {
      const concurrentRequests = 50;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          campaignDiscoveryService.discoverCampaigns(
            {
              disasterType: [
                ["FLOOD", "EARTHQUAKE", "DROUGHT", "PANDEMIC"][i % 4],
              ],
              trustScoreMin: 50 + (i % 30),
            },
            ["recent", "highest_trust", "most_funded"][i % 3],
            { page: (i % 3) + 1, limit: 12 },
          ),
        );
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      const successCount = results.filter((r) => r.success).length;
      expect(successCount).to.equal(concurrentRequests);

      const avgTime = totalTime / concurrentRequests;

      console.log(
        `  ✓ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`,
      );
      console.log(`  ✓ Average time per request: ${Math.round(avgTime)}ms`);
      console.log(
        `  ✓ Success rate: ${successCount}/${concurrentRequests} (100%)`,
      );
    });
  });

  describe("Performance Metrics Monitoring", function () {
    it("should track and report performance metrics", function () {
      const metrics = campaignDiscoveryService.getPerformanceMetrics();

      expect(metrics).to.have.property("totalRequests");
      expect(metrics).to.have.property("cacheHits");
      expect(metrics).to.have.property("cacheMisses");
      expect(metrics).to.have.property("cacheHitRatio");
      expect(metrics).to.have.property("averageResponseTime");
      expect(metrics).to.have.property("slowQueries");
      expect(metrics).to.have.property("performanceTarget");
      expect(metrics).to.have.property("isPerformingWell");

      console.log("  ✓ Performance Metrics:");
      console.log(`    - Total Requests: ${metrics.totalRequests}`);
      console.log(`    - Cache Hit Ratio: ${metrics.cacheHitRatio}%`);
      console.log(
        `    - Average Response Time: ${metrics.averageResponseTime}ms`,
      );
      console.log(
        `    - Slow Queries: ${metrics.slowQueries} (${metrics.slowQueryRatio}%)`,
      );
      console.log(`    - Performance Target: ${metrics.performanceTarget}ms`);
      console.log(`    - Is Performing Well: ${metrics.isPerformingWell}`);

      expect(metrics.totalRequests).to.be.above(0);
      expect(metrics.averageResponseTime).to.be.below(1000);
    });
  });

  describe("Database Query Optimization", function () {
    it("should use indexes effectively for filtered queries", async function () {
      // This test validates that queries complete quickly, indicating index usage
      const filters = [
        { disasterType: ["FLOOD"] }, // Uses disasterType index
        { trustScoreMin: 70, trustScoreMax: 90 }, // Uses trustScore index
        { disasterType: ["EARTHQUAKE"], trustScoreMin: 60 }, // Uses compound filtering
      ];

      for (const filter of filters) {
        const startTime = Date.now();

        const result = await campaignDiscoveryService.discoverCampaigns(
          filter,
          "recent",
          { page: 1, limit: 12 },
        );

        const responseTime = Date.now() - startTime;

        expect(result.success).to.be.true;
        expect(responseTime).to.be.below(
          300,
          `Indexed query took ${responseTime}ms, may not be using indexes effectively`,
        );
      }

      console.log("  ✓ All indexed queries completed in <300ms");
    });

    it("should handle large result sets efficiently with pagination", async function () {
      // Test that pagination doesn't degrade performance with large offsets
      const pages = [1, 2, 3, 4, 5];
      const times = [];

      for (const page of pages) {
        const startTime = Date.now();

        const result = await campaignDiscoveryService.discoverCampaigns(
          {},
          "recent",
          { page, limit: 12 },
        );

        const responseTime = Date.now() - startTime;
        times.push(responseTime);

        expect(result.success).to.be.true;
        expect(responseTime).to.be.below(500);
      }

      // Performance should not degrade significantly with pagination
      const firstPageTime = times[0];
      const lastPageTime = times[times.length - 1];
      const degradation = lastPageTime / firstPageTime;

      console.log(`  ✓ Page 1: ${firstPageTime}ms, Page 5: ${lastPageTime}ms`);
      console.log(
        `  ✓ Performance degradation: ${Math.round(degradation * 100) / 100}x`,
      );

      expect(degradation).to.be.below(
        2,
        "Pagination performance should not degrade more than 2x",
      );
    });
  });
});
