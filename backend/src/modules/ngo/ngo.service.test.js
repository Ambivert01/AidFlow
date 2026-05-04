import { expect } from "chai";
import { getEnhancedNgoDashboard } from "./ngo.service.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { redisConnection } from "../../config/redis.config.js";
import mongoose from "mongoose";

describe("NGO Dashboard Service - Redis Caching", () => {
  let testNgoId;
  let testCampaignId;

  before(async () => {
    // Create test NGO ID
    testNgoId = new mongoose.Types.ObjectId();
    testCampaignId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    // Clean up Redis cache after each test
    const cacheKey = `dashboard:ngo:${testNgoId}`;
    try {
      await redisConnection.del(cacheKey);
    } catch (error) {
      console.error("Error cleaning up Redis cache:", error);
    }
  });

  describe("Cache Miss Scenario", () => {
    it("should return dashboard data with cacheHit: false on first request", async () => {
      const result = await getEnhancedNgoDashboard(testNgoId);

      expect(result).to.have.property("success", true);
      expect(result.data).to.have.property("metadata");
      expect(result.data.metadata).to.have.property("cacheHit", false);
      expect(result.data.metadata).to.have.property("queryTimeMs");
      expect(result.data.metadata.queryTimeMs).to.be.a("number");
    });

    it("should store dashboard data in Redis cache after aggregation", async () => {
      const cacheKey = `dashboard:ngo:${testNgoId}`;

      // First request - should cache the data
      await getEnhancedNgoDashboard(testNgoId);

      // Check if data is stored in Redis
      const cachedData = await redisConnection.get(cacheKey);
      expect(cachedData).to.not.be.null;

      const parsedData = JSON.parse(cachedData);
      expect(parsedData).to.have.property("overview");
      expect(parsedData).to.have.property("campaigns");
      expect(parsedData).to.have.property("beneficiaries");
      expect(parsedData).to.have.property("wallets");
      expect(parsedData).to.have.property("proofs");
      expect(parsedData).to.have.property("metadata");
    });

    it("should set Redis cache TTL to 300 seconds (5 minutes)", async () => {
      const cacheKey = `dashboard:ngo:${testNgoId}`;

      // First request - should cache the data
      await getEnhancedNgoDashboard(testNgoId);

      // Check TTL
      const ttl = await redisConnection.ttl(cacheKey);
      expect(ttl).to.be.greaterThan(0);
      expect(ttl).to.be.lessThanOrEqual(300);
    });
  });

  describe("Cache Hit Scenario", () => {
    it("should return cached data with cacheHit: true on subsequent requests", async () => {
      // First request - cache miss
      const firstResult = await getEnhancedNgoDashboard(testNgoId);
      expect(firstResult.data.metadata.cacheHit).to.equal(false);

      // Second request - cache hit
      const secondResult = await getEnhancedNgoDashboard(testNgoId);
      expect(secondResult.data.metadata.cacheHit).to.equal(true);
    });

    it("should return cached data faster than aggregating from database", async () => {
      // First request - cache miss (aggregation)
      const firstResult = await getEnhancedNgoDashboard(testNgoId);
      const firstQueryTime = firstResult.data.metadata.queryTimeMs;

      // Second request - cache hit
      const secondResult = await getEnhancedNgoDashboard(testNgoId);
      const secondQueryTime = secondResult.data.metadata.queryTimeMs;

      // Cache hit should be significantly faster (< 100ms as per requirements)
      expect(secondQueryTime).to.be.lessThan(100);
      expect(secondQueryTime).to.be.lessThan(firstQueryTime);
    });

    it("should return the same data structure for cache hit and cache miss", async () => {
      // First request - cache miss
      const firstResult = await getEnhancedNgoDashboard(testNgoId);

      // Second request - cache hit
      const secondResult = await getEnhancedNgoDashboard(testNgoId);

      // Compare data structures (excluding metadata which will differ)
      expect(secondResult.data.overview).to.deep.equal(
        firstResult.data.overview,
      );
      expect(secondResult.data.campaigns).to.deep.equal(
        firstResult.data.campaigns,
      );
      expect(secondResult.data.beneficiaries).to.deep.equal(
        firstResult.data.beneficiaries,
      );
      expect(secondResult.data.wallets).to.deep.equal(firstResult.data.wallets);
      expect(secondResult.data.proofs).to.deep.equal(firstResult.data.proofs);
    });
  });

  describe("Cache Key Format", () => {
    it("should use correct cache key format: dashboard:ngo:{ngoId}", async () => {
      const cacheKey = `dashboard:ngo:${testNgoId}`;

      await getEnhancedNgoDashboard(testNgoId);

      const cachedData = await redisConnection.get(cacheKey);
      expect(cachedData).to.not.be.null;
    });

    it("should isolate cache data by ngoId", async () => {
      const ngoId1 = new mongoose.Types.ObjectId();
      const ngoId2 = new mongoose.Types.ObjectId();

      // Request for NGO 1
      await getEnhancedNgoDashboard(ngoId1);

      // Request for NGO 2
      await getEnhancedNgoDashboard(ngoId2);

      // Check that both have separate cache entries
      const cacheKey1 = `dashboard:ngo:${ngoId1}`;
      const cacheKey2 = `dashboard:ngo:${ngoId2}`;

      const cachedData1 = await redisConnection.get(cacheKey1);
      const cachedData2 = await redisConnection.get(cacheKey2);

      expect(cachedData1).to.not.be.null;
      expect(cachedData2).to.not.be.null;
      expect(cachedData1).to.not.equal(cachedData2);

      // Clean up
      await redisConnection.del(cacheKey1);
      await redisConnection.del(cacheKey2);
    });
  });

  describe("Graceful Degradation", () => {
    it("should continue operation if Redis read fails", async () => {
      // Temporarily break Redis connection by using invalid key operation
      const originalGet = redisConnection.get;
      redisConnection.get = async () => {
        throw new Error("Simulated Redis read error");
      };

      // Should still return data (from database aggregation)
      const result = await getEnhancedNgoDashboard(testNgoId);
      expect(result).to.have.property("success", true);
      expect(result.data.metadata.cacheHit).to.equal(false);

      // Restore original method
      redisConnection.get = originalGet;
    });

    it("should continue operation if Redis write fails", async () => {
      // Temporarily break Redis connection by using invalid key operation
      const originalSetex = redisConnection.setex;
      redisConnection.setex = async () => {
        throw new Error("Simulated Redis write error");
      };

      // Should still return data (even if caching fails)
      const result = await getEnhancedNgoDashboard(testNgoId);
      expect(result).to.have.property("success", true);
      expect(result.data).to.have.property("overview");

      // Restore original method
      redisConnection.setex = originalSetex;
    });
  });

  describe("Empty Dashboard Scenario", () => {
    it("should return empty dashboard structure when NGO has no campaigns", async () => {
      const ngoWithNoCampaigns = new mongoose.Types.ObjectId();

      const result = await getEnhancedNgoDashboard(ngoWithNoCampaigns);

      expect(result.success).to.equal(true);
      expect(result.data.overview.totalCampaigns).to.equal(0);
      expect(result.data.campaigns).to.be.an("array").that.is.empty;
      expect(result.data.beneficiaries.total).to.equal(0);
      expect(result.data.wallets.totalCreated).to.equal(0);
      expect(result.data.metadata.cacheHit).to.equal(false);
    });
  });

  describe("Metadata Validation", () => {
    it("should include all required metadata fields", async () => {
      const result = await getEnhancedNgoDashboard(testNgoId);

      expect(result.data.metadata).to.have.property("dataFreshness");
      expect(result.data.metadata).to.have.property("cacheHit");
      expect(result.data.metadata).to.have.property("queryTimeMs");

      expect(result.data.metadata.dataFreshness).to.be.instanceOf(Date);
      expect(result.data.metadata.cacheHit).to.be.a("boolean");
      expect(result.data.metadata.queryTimeMs).to.be.a("number");
    });

    it("should update queryTimeMs on cache hit", async () => {
      // First request
      await getEnhancedNgoDashboard(testNgoId);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second request - cache hit
      const result = await getEnhancedNgoDashboard(testNgoId);

      expect(result.data.metadata.cacheHit).to.equal(true);
      expect(result.data.metadata.queryTimeMs).to.be.greaterThan(0);
    });
  });
});
