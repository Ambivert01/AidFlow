import { Campaign } from "../../models/ngo/Campaign.model.js";
import { User } from "../../models/auth/User.model.js";
import { AppError } from "../../utils/AppError.js";
import { BaseService } from "../../core/base.service.js";
import { CAMPAIGN_STATUS } from "./campaign.constants.js";
import trustEngine from "../../engines/trust.engine.js";
import campaignDataParser from "./campaign.parser.js";
import campaignRecommendationService from "./campaign.recommendation.service.js";
import campaignValidationService from "./campaign.validation.service.js";
import campaignRetryService from "./campaign.retry.service.js";
import { redisConnection } from "../../config/redis.config.js";

/**
 * Campaign Discovery Service
 * Provides advanced campaign filtering, sorting, and trust score integration
 * for donor campaign discovery and selection with comprehensive caching and performance optimization
 */
class CampaignDiscoveryService {
  constructor() {
    this.redis = redisConnection;
    this.CACHE_TTL = 15 * 60; // 15 minutes for campaign listings
    this.TRUST_CACHE_TTL = 60 * 60; // 1 hour for trust scores
    this.PERFORMANCE_TARGET_MS = 500; // 500ms response time target

    // Performance monitoring
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      slowQueries: 0, // Queries > 500ms
    };
  }

  /**
   * Validate sort parameter
   * @param {String} sort - Sort criteria to validate
   * @returns {String} - Validated sort criteria
   */
  validateSort(sort) {
    const validSorts = [
      "trust_desc",
      "highest_trust",
      "funded_desc",
      "most_funded",
      "recent",
      "most_recent",
      "ending_soon",
      "funding_progress_desc",
      "transparency_desc",
      "recommended",
    ];

    if (!sort || typeof sort !== "string") {
      return "recent"; // Default sort
    }

    const normalizedSort = sort.toLowerCase().trim();
    return validSorts.includes(normalizedSort) ? normalizedSort : "recent";
  }

  /**
   * Discover campaigns with advanced filtering and sorting
   * @param {Object} filters - Filter criteria
   * @param {String} sort - Sort criteria
   * @param {Object} pagination - Pagination options
   * @returns {Object} - Filtered and sorted campaigns with trust scores
   */
  async discoverCampaigns(
    filters = {},
    sort = "recent",
    pagination = { page: 1, limit: 12 },
  ) {
    const startTime = Date.now();
    let cacheHit = false;

    try {
      // Update performance metrics
      this.performanceMetrics.totalRequests++;

      // Validate and sanitize pagination to prevent MongoDB errors
      const validatedPagination = {
        page: Math.max(1, parseInt(pagination.page) || 1),
        limit: Math.max(1, Math.min(50, parseInt(pagination.limit) || 12)),
      };

      // Validate filters and sort
      const validatedFilters = this.validateFilters(filters);
      const validatedSort = this.validateSort(sort);

      // Generate cache key
      const cacheKey = this.generateCacheKey(
        "campaigns",
        validatedFilters,
        validatedSort,
        validatedPagination,
      );

      // Try to get from cache first
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          cacheHit = true;
          this.performanceMetrics.cacheHits++;

          const result = JSON.parse(cached);
          this.trackPerformance(startTime, cacheHit);
          return BaseService.success(result);
        }
      } catch (cacheError) {
        console.warn(
          "Cache unavailable, falling back to database:",
          cacheError,
        );
      }

      // Cache miss - increment counter
      this.performanceMetrics.cacheMisses++;

      // Build aggregation pipeline with performance optimization
      const pipeline = this.buildOptimizedAggregationPipeline(
        validatedFilters,
        validatedSort,
        validatedPagination,
      );

      // Execute aggregation with timeout
      const [campaigns, totalCount] = await Promise.all([
        this.executeWithTimeout(
          Campaign.aggregate(pipeline),
          this.PERFORMANCE_TARGET_MS - 100, // Leave 100ms buffer for other operations
        ),
        this.getTotalCountOptimized(validatedFilters),
      ]);

      // Enhance campaigns with trust scores (with caching)
      const enhancedCampaigns =
        await this.enhanceCampaignsWithTrustScores(campaigns);

      const result = {
        campaigns: enhancedCampaigns,
        pagination: {
          page: validatedPagination.page,
          limit: validatedPagination.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / validatedPagination.limit),
        },
        filters: validatedFilters,
        sort: validatedSort,
        performance: {
          responseTime: Date.now() - startTime,
          cacheHit,
          totalCampaigns: enhancedCampaigns.length,
        },
      };

      // Cache the result with optimized TTL based on data freshness
      try {
        const cacheTTL = this.calculateOptimalCacheTTL(
          validatedFilters,
          validatedSort,
        );
        await this.redis.setex(cacheKey, cacheTTL, JSON.stringify(result));
      } catch (cacheError) {
        console.warn("Failed to cache result:", cacheError);
      }

      this.trackPerformance(startTime, cacheHit);
      return BaseService.success(result);
    } catch (error) {
      console.error(
        "[CampaignDiscoveryService] Error discovering campaigns:",
        error,
      );
      this.trackPerformance(startTime, cacheHit, true);
      throw error;
    }
  }

  /**
   * Validate and sanitize filter parameters
   * @param {Object} filters - Raw filter parameters
   * @returns {Object} - Validated filters
   */
  validateFilters(filters) {
    const validated = {};

    // Disaster type filter with multiple selection support
    if (filters.disasterType) {
      const validTypes = [
        "FLOOD",
        "EARTHQUAKE",
        "FAMINE",
        "WAR",
        "DROUGHT",
        "PANDEMIC",
        "CYCLONE",
        "FIRE",
        "OTHER",
      ];

      if (Array.isArray(filters.disasterType)) {
        // Multiple disaster types
        const validatedTypes = filters.disasterType
          .map((type) => type.toUpperCase())
          .filter((type) => validTypes.includes(type));
        if (validatedTypes.length > 0) {
          validated.disasterType = validatedTypes;
        }
      } else if (typeof filters.disasterType === "string") {
        // Single disaster type
        const upperType = filters.disasterType.toUpperCase();
        if (validTypes.includes(upperType)) {
          validated.disasterType = [upperType]; // Normalize to array
        }
      }
    }

    // Location filter with enhanced search capabilities
    if (filters.location && typeof filters.location === "string") {
      const location = filters.location.trim();
      if (location.length >= 2) {
        // Minimum 2 characters for search
        validated.location = location;
      }
    }

    // Trust score range with validation
    if (filters.trustScoreMin !== undefined) {
      const min = parseInt(filters.trustScoreMin);
      if (!isNaN(min) && min >= 0 && min <= 100) {
        validated.trustScoreMin = min;
      }
    }
    if (filters.trustScoreMax !== undefined) {
      const max = parseInt(filters.trustScoreMax);
      if (!isNaN(max) && max >= 0 && max <= 100) {
        validated.trustScoreMax = max;
      }
    }

    // Ensure min <= max for trust score
    if (
      validated.trustScoreMin !== undefined &&
      validated.trustScoreMax !== undefined
    ) {
      if (validated.trustScoreMin > validated.trustScoreMax) {
        // Swap values if min > max
        [validated.trustScoreMin, validated.trustScoreMax] = [
          validated.trustScoreMax,
          validated.trustScoreMin,
        ];
      }
    }

    // Funding progress range with validation
    if (filters.fundingProgressMin !== undefined) {
      const min = parseInt(filters.fundingProgressMin);
      if (!isNaN(min) && min >= 0 && min <= 100) {
        validated.fundingProgressMin = min;
      }
    }
    if (filters.fundingProgressMax !== undefined) {
      const max = parseInt(filters.fundingProgressMax);
      if (!isNaN(max) && max >= 0 && max <= 100) {
        validated.fundingProgressMax = max;
      }
    }

    // Ensure min <= max for funding progress
    if (
      validated.fundingProgressMin !== undefined &&
      validated.fundingProgressMax !== undefined
    ) {
      if (validated.fundingProgressMin > validated.fundingProgressMax) {
        [validated.fundingProgressMin, validated.fundingProgressMax] = [
          validated.fundingProgressMax,
          validated.fundingProgressMin,
        ];
      }
    }

    // Target amount range filter
    if (filters.targetAmountMin !== undefined) {
      const min = parseInt(filters.targetAmountMin);
      if (!isNaN(min) && min >= 0) {
        validated.targetAmountMin = min;
      }
    }
    if (filters.targetAmountMax !== undefined) {
      const max = parseInt(filters.targetAmountMax);
      if (!isNaN(max) && max >= 0) {
        validated.targetAmountMax = max;
      }
    }

    // NGO verification status with multiple selection
    if (filters.ngoVerificationStatus) {
      const validStatuses = ["APPROVED", "PENDING", "REJECTED"];
      let statusArray = [];

      if (Array.isArray(filters.ngoVerificationStatus)) {
        statusArray = filters.ngoVerificationStatus;
      } else if (typeof filters.ngoVerificationStatus === "string") {
        statusArray = [filters.ngoVerificationStatus];
      }

      const validatedStatuses = statusArray.filter((status) =>
        validStatuses.includes(status),
      );
      if (validatedStatuses.length > 0) {
        validated.ngoVerificationStatus = validatedStatuses;
      }
    }

    // Campaign age filter (days since creation)
    if (filters.maxAge !== undefined) {
      const maxAge = parseInt(filters.maxAge);
      if (!isNaN(maxAge) && maxAge > 0) {
        validated.maxAge = maxAge;
      }
    }

    // End date filter (campaigns ending within X days)
    if (filters.endingWithinDays !== undefined) {
      const days = parseInt(filters.endingWithinDays);
      if (!isNaN(days) && days > 0) {
        validated.endingWithinDays = days;
      }
    }

    // Transparency score filter
    if (filters.minTransparencyScore !== undefined) {
      const score = parseInt(filters.minTransparencyScore);
      if (!isNaN(score) && score >= 0 && score <= 100) {
        validated.minTransparencyScore = score;
      }
    }

    // Proof count filter (campaigns with minimum proof submissions)
    if (filters.minProofCount !== undefined) {
      const count = parseInt(filters.minProofCount);
      if (!isNaN(count) && count >= 0) {
        validated.minProofCount = count;
      }
    }

    // Text search across title and description
    if (filters.search && typeof filters.search === "string") {
      const search = filters.search.trim();
      if (search.length >= 2) {
        validated.search = search;
      }
    }

    return validated;
  }

  /**
   * Build sort stage for aggregation pipeline
   * @param {String} sort - Sort criteria
   * @returns {Object} - Sort stage
   */
  buildSortStage(sort) {
    switch (sort) {
      case "trust_desc":
      case "highest_trust":
        // Highest trust score first, then most recent
        return { trustScore: -1, createdAt: -1 };
      case "funded_desc":
      case "most_funded":
        // Most funded campaigns first, then most recent
        return { totalDonated: -1, createdAt: -1 };
      case "recent":
      case "most_recent":
        // Most recently created campaigns first
        return { createdAt: -1 };
      case "ending_soon":
        // Campaigns ending soonest first, then most recent
        return { endDate: 1, createdAt: -1 };
      case "funding_progress_desc":
        // Campaigns with highest funding progress first
        return { fundingProgress: -1, createdAt: -1 };
      case "transparency_desc":
        // Campaigns with highest transparency score first
        return { transparencyScore: -1, createdAt: -1 };
      case "recommended":
        // For personalized recommendations - trust score + funding progress
        return {
          trustScore: -1,
          fundingProgress: -1,
          totalDonated: -1,
          createdAt: -1,
        };
      default:
        // Default to most recent
        return { createdAt: -1 };
    }
  }

  /**
   * Enhance campaigns with trust scores
   * @param {Array} campaigns - Campaign documents
   * @returns {Array} - Enhanced campaigns with trust scores
   */
  async enhanceCampaignsWithTrustScores(campaigns) {
    if (!campaigns || campaigns.length === 0) {
      return [];
    }

    try {
      // Get trust scores for all campaigns
      const campaignIds = campaigns.map((c) => c._id.toString());
      const trustScores = await this.getBatchTrustScores(campaignIds);

      // Enhance campaigns with trust scores and parse data consistently
      return campaigns.map((campaign) => {
        try {
          // Parse campaign data for consistent formatting
          const parsedCampaign = campaignDataParser.parseCampaignData({
            ...campaign,
            trustScore: trustScores[campaign._id.toString()] || null,
          });

          // Return enhanced campaign with both raw and parsed data
          return {
            ...campaign,
            trustScore: trustScores[campaign._id.toString()] || null,
            trustScoreStatus: trustScores[campaign._id.toString()]
              ? "AVAILABLE"
              : "PENDING",
            // Add parsed data for consistent frontend consumption
            parsed: {
              fundingProgress: parsedCampaign.fundingProgress,
              location: parsedCampaign.location,
              policySnapshot: parsedCampaign.policySnapshot,
              displayText: parsedCampaign.displayText,
            },
          };
        } catch (parseError) {
          console.warn(
            `[CampaignDiscoveryService] Failed to parse campaign ${campaign._id}:`,
            parseError,
          );
          // Return campaign with basic trust score if parsing fails
          return {
            ...campaign,
            trustScore: trustScores[campaign._id.toString()] || null,
            trustScoreStatus: trustScores[campaign._id.toString()]
              ? "AVAILABLE"
              : "PENDING",
            parsed: null,
          };
        }
      });
    } catch (error) {
      console.error(
        "[CampaignDiscoveryService] Error enhancing with trust scores:",
        error,
      );
      // Return campaigns without trust scores on error
      return campaigns.map((campaign) => ({
        ...campaign,
        trustScore: null,
        trustScoreStatus: "UNAVAILABLE",
        parsed: null,
      }));
    }
  }

  /**
   * Get trust scores for multiple campaigns (batch processing)
   * @param {Array} campaignIds - Array of campaign IDs
   * @returns {Object} - Map of campaignId -> trustScore
   */
  async getBatchTrustScores(campaignIds) {
    try {
      // Use the enhanced Trust Engine batch processing with caching
      const trustScores = await trustEngine.getBatchTrustScoresWithCache(
        campaignIds,
        "CAMPAIGN",
      );
      return trustScores;
    } catch (error) {
      console.error(
        "[CampaignDiscoveryService] Error getting batch trust scores:",
        error,
      );
      // Return empty object on error - campaigns will show as unavailable
      return {};
    }
  }

  /**
   * Generate cache key for campaign discovery results
   * @param {String} prefix - Cache key prefix
   * @param {Object} filters - Filter parameters
   * @param {String} sort - Sort criteria
   * @param {Object} pagination - Pagination parameters
   * @returns {String} - Cache key
   */
  generateCacheKey(prefix, filters, sort, pagination) {
    const filterStr = JSON.stringify(filters);
    const paginationStr = `${pagination.page}:${pagination.limit}`;
    return `${prefix}:${Buffer.from(filterStr).toString("base64")}:${sort}:${paginationStr}`;
  }

  /**
   * Invalidate campaign discovery cache
   * @param {String} campaignId - Campaign ID that was updated
   */
  async invalidateCache(campaignId = null) {
    try {
      // Invalidate general campaign cache
      const keys = await this.redis.keys("campaigns:*");
      if (keys.length > 0) {
        await this.redis.del(keys);
      }

      // Invalidate specific trust score cache if campaignId provided
      if (campaignId) {
        await trustEngine.invalidateTrustCache(campaignId, "CAMPAIGN");
      }
    } catch (error) {
      console.warn("Failed to invalidate cache:", error);
    }
  }

  /**
   * Get campaign recommendations for a donor
   * @param {String} donorId - Donor user ID
   * @param {Object} preferences - Donor preferences
   * @returns {Object} - Recommended campaigns
   */
  async getRecommendations(donorId, preferences = {}) {
    try {
      // Use the dedicated recommendation engine for personalized suggestions
      return await campaignRecommendationService.getPersonalizedRecommendations(
        donorId,
        {
          limit: preferences.limit || 6,
          minTrustScore: preferences.minTrustScore || 50,
          includeReasoning: preferences.includeReasoning !== false,
          excludeCampaignIds: preferences.excludeCampaignIds || [],
        },
      );
    } catch (error) {
      console.error(
        "[CampaignDiscoveryService] Error getting recommendations:",
        error,
      );

      // Fallback to basic discovery if recommendation engine fails
      console.warn("Falling back to basic discovery for recommendations");
      return await this.discoverCampaigns(
        {
          trustScoreMin: preferences.minTrustScore || 60,
          disasterType: preferences.disasterType,
          location: preferences.location,
        },
        "recommended",
        { page: 1, limit: preferences.limit || 6 },
      );
    }
  }

  /**
   * Get discovery statistics for the discovery interface
   * @returns {Object} - Discovery statistics
   */
  async getDiscoveryStats() {
    try {
      const cacheKey = "discovery:stats";

      // Try cache first
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        console.warn("Stats cache unavailable:", cacheError);
      }

      // Calculate stats
      const [totalActive, byDisasterType, avgTrustScore, totalFunding] =
        await Promise.all([
          Campaign.countDocuments({ status: CAMPAIGN_STATUS.ACTIVE }),
          Campaign.aggregate([
            { $match: { status: CAMPAIGN_STATUS.ACTIVE } },
            { $group: { _id: "$disasterType", count: { $sum: 1 } } },
          ]),
          Campaign.aggregate([
            {
              $match: {
                status: CAMPAIGN_STATUS.ACTIVE,
                trustScore: { $gt: 0 },
              },
            },
            { $group: { _id: null, avgTrust: { $avg: "$trustScore" } } },
          ]),
          Campaign.aggregate([
            { $match: { status: CAMPAIGN_STATUS.ACTIVE } },
            { $group: { _id: null, totalFunding: { $sum: "$totalDonated" } } },
          ]),
        ]);

      const stats = {
        totalActiveCampaigns: totalActive,
        campaignsByType: byDisasterType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageTrustScore:
          avgTrustScore.length > 0 ? Math.round(avgTrustScore[0].avgTrust) : 0,
        totalFunding:
          totalFunding.length > 0 ? totalFunding[0].totalFunding : 0,
        lastUpdated: new Date(),
      };

      // Cache for 5 minutes
      try {
        await this.redis.setex(cacheKey, 300, JSON.stringify(stats));
      } catch (cacheError) {
        console.warn("Failed to cache stats:", cacheError);
      }

      return stats;
    } catch (error) {
      console.error(
        "[CampaignDiscoveryService] Error getting discovery stats:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get performance metrics for monitoring
   * @returns {Object} - Performance metrics
   */
  getPerformanceMetrics() {
    const cacheHitRatio =
      this.performanceMetrics.totalRequests > 0
        ? (this.performanceMetrics.cacheHits /
            this.performanceMetrics.totalRequests) *
          100
        : 0;

    return {
      ...this.performanceMetrics,
      cacheHitRatio: Math.round(cacheHitRatio * 100) / 100,
      slowQueryRatio:
        this.performanceMetrics.totalRequests > 0
          ? Math.round(
              (this.performanceMetrics.slowQueries /
                this.performanceMetrics.totalRequests) *
                100 *
                100,
            ) / 100
          : 0,
      averageResponseTime: Math.round(
        this.performanceMetrics.averageResponseTime,
      ),
      performanceTarget: this.PERFORMANCE_TARGET_MS,
      isPerformingWell:
        this.performanceMetrics.averageResponseTime <=
          this.PERFORMANCE_TARGET_MS && cacheHitRatio >= 80,
    };
  }

  /**
   * Track performance metrics for monitoring and optimization
   * @param {Number} startTime - Request start time
   * @param {Boolean} cacheHit - Whether request was served from cache
   * @param {Boolean} isError - Whether request resulted in error
   */
  trackPerformance(startTime, cacheHit, isError = false) {
    const responseTime = Date.now() - startTime;

    // Update average response time (rolling average)
    this.performanceMetrics.averageResponseTime =
      (this.performanceMetrics.averageResponseTime *
        (this.performanceMetrics.totalRequests - 1) +
        responseTime) /
      this.performanceMetrics.totalRequests;

    // Track slow queries
    if (responseTime > this.PERFORMANCE_TARGET_MS) {
      this.performanceMetrics.slowQueries++;
      console.warn(
        `[CampaignDiscoveryService] Slow query detected: ${responseTime}ms (target: ${this.PERFORMANCE_TARGET_MS}ms)`,
      );
    }

    // Log performance metrics periodically
    if (this.performanceMetrics.totalRequests % 100 === 0) {
      this.logPerformanceMetrics();
    }
  }

  /**
   * Log current performance metrics
   */
  logPerformanceMetrics() {
    const cacheHitRatio =
      this.performanceMetrics.totalRequests > 0
        ? (
            (this.performanceMetrics.cacheHits /
              this.performanceMetrics.totalRequests) *
            100
          ).toFixed(2)
        : 0;

    console.log(`[CampaignDiscoveryService] Performance Metrics:`, {
      totalRequests: this.performanceMetrics.totalRequests,
      cacheHitRatio: `${cacheHitRatio}%`,
      averageResponseTime: `${Math.round(this.performanceMetrics.averageResponseTime)}ms`,
      slowQueries: this.performanceMetrics.slowQueries,
      slowQueryRatio: `${((this.performanceMetrics.slowQueries / this.performanceMetrics.totalRequests) * 100).toFixed(2)}%`,
    });
  }

  /**
   * Execute query with timeout to ensure performance targets
   * @param {Promise} query - MongoDB query promise
   * @param {Number} timeoutMs - Timeout in milliseconds
   * @returns {Promise} - Query result or timeout error
   */
  async executeWithTimeout(query, timeoutMs) {
    return Promise.race([
      query,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Query timeout after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }

  /**
   * Calculate optimal cache TTL based on query characteristics
   * @param {Object} filters - Query filters
   * @param {String} sort - Sort criteria
   * @returns {Number} - Cache TTL in seconds
   */
  calculateOptimalCacheTTL(filters, sort) {
    let ttl = this.CACHE_TTL; // Base 15 minutes

    // Longer cache for simple queries
    if (Object.keys(filters).length <= 2) {
      ttl = ttl * 1.5; // 22.5 minutes
    }

    // Shorter cache for complex filters (data changes more frequently)
    if (Object.keys(filters).length >= 5) {
      ttl = ttl * 0.5; // 7.5 minutes
    }

    // Longer cache for trust-based sorts (trust scores change less frequently)
    if (sort.includes("trust")) {
      ttl = ttl * 1.2; // 18 minutes
    }

    // Shorter cache for recent sorts (new campaigns appear frequently)
    if (sort === "recent") {
      ttl = ttl * 0.7; // 10.5 minutes
    }

    return Math.round(ttl);
  }

  /**
   * Build optimized aggregation pipeline with performance enhancements
   * @param {Object} filters - Validated filters
   * @param {String} sort - Sort criteria
   * @param {Object} pagination - Pagination options
   * @returns {Array} - Optimized aggregation pipeline
   */
  buildOptimizedAggregationPipeline(filters, sort, pagination) {
    const pipeline = [];

    // Early filtering for better performance - most selective filters first
    const matchStage = {
      status: CAMPAIGN_STATUS.ACTIVE, // Index on status
    };

    // Apply most selective filters first for better index usage
    if (filters.disasterType) {
      matchStage.disasterType = Array.isArray(filters.disasterType)
        ? { $in: filters.disasterType }
        : filters.disasterType;
    }

    // Trust score range filter (will be applied after lookup if needed)
    let trustScoreFilter = null;
    if (
      filters.trustScoreMin !== undefined ||
      filters.trustScoreMax !== undefined
    ) {
      trustScoreFilter = {};
      if (filters.trustScoreMin !== undefined) {
        trustScoreFilter.$gte = filters.trustScoreMin;
      }
      if (filters.trustScoreMax !== undefined) {
        trustScoreFilter.$lte = filters.trustScoreMax;
      }
    }

    // Target amount range filter
    if (
      filters.targetAmountMin !== undefined ||
      filters.targetAmountMax !== undefined
    ) {
      const targetAmountFilter = {};
      if (filters.targetAmountMin !== undefined) {
        targetAmountFilter.$gte = filters.targetAmountMin;
      }
      if (filters.targetAmountMax !== undefined) {
        targetAmountFilter.$lte = filters.targetAmountMax;
      }
      matchStage.targetAmount = targetAmountFilter;
    }

    // Campaign age filter
    if (filters.maxAge !== undefined) {
      const maxAgeDate = new Date(
        Date.now() - filters.maxAge * 24 * 60 * 60 * 1000,
      );
      matchStage.createdAt = { $gte: maxAgeDate };
    }

    // End date filter
    if (filters.endingWithinDays !== undefined) {
      const endDateLimit = new Date(
        Date.now() + filters.endingWithinDays * 24 * 60 * 60 * 1000,
      );
      matchStage.endDate = { $lte: endDateLimit };
    }

    // Transparency score filter
    if (filters.minTransparencyScore !== undefined) {
      matchStage.transparencyScore = { $gte: filters.minTransparencyScore };
    }

    // Proof count filter
    if (filters.minProofCount !== undefined) {
      matchStage.proofCount = { $gte: filters.minProofCount };
    }

    // Text search filter
    if (filters.search) {
      matchStage.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Location filter
    if (filters.location) {
      if (!matchStage.$or) {
        matchStage.$or = [];
      }
      matchStage.$or.push(
        { "location.state": { $regex: filters.location, $options: "i" } },
        { "location.district": { $regex: filters.location, $options: "i" } },
        { "location.ward": { $regex: filters.location, $options: "i" } },
      );
    }

    pipeline.push({ $match: matchStage });

    // Lookup NGO information only if needed
    const needsNGOLookup =
      filters.ngoVerificationStatus && filters.ngoVerificationStatus.length > 0;

    if (needsNGOLookup) {
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "ngo",
          pipeline: [
            { $project: { name: 1, verificationStatus: 1 } }, // Only fetch needed fields
          ],
        },
      });

      pipeline.push({
        $unwind: "$ngo",
      });

      // NGO verification status filter
      pipeline.push({
        $match: {
          "ngo.verificationStatus": { $in: filters.ngoVerificationStatus },
        },
      });
    }

    // Add computed fields efficiently
    const addFieldsStage = {};

    // Funding progress calculation
    if (
      filters.fundingProgressMin !== undefined ||
      filters.fundingProgressMax !== undefined ||
      sort === "funding_progress_desc"
    ) {
      addFieldsStage.fundingProgress = {
        $cond: {
          if: { $gt: ["$targetAmount", 0] },
          then: {
            $multiply: [{ $divide: ["$totalDonated", "$targetAmount"] }, 100],
          },
          else: 0,
        },
      };
    }

    // Add NGO fields if lookup was performed
    if (needsNGOLookup) {
      addFieldsStage.ngoName = "$ngo.name";
      addFieldsStage.ngoVerificationStatus = "$ngo.verificationStatus";
    }

    if (Object.keys(addFieldsStage).length > 0) {
      pipeline.push({ $addFields: addFieldsStage });
    }

    // Apply funding progress filter after calculation
    if (
      filters.fundingProgressMin !== undefined ||
      filters.fundingProgressMax !== undefined
    ) {
      const progressFilter = {};
      if (filters.fundingProgressMin !== undefined) {
        progressFilter.$gte = filters.fundingProgressMin;
      }
      if (filters.fundingProgressMax !== undefined) {
        progressFilter.$lte = filters.fundingProgressMax;
      }
      pipeline.push({
        $match: { fundingProgress: progressFilter },
      });
    }

    // Apply trust score filter if needed (after potential trust score lookup)
    if (trustScoreFilter) {
      pipeline.push({
        $match: { trustScore: trustScoreFilter },
      });
    }

    // Apply sorting
    const sortStage = this.buildSortStage(sort);
    pipeline.push({ $sort: sortStage });

    // Apply pagination
    const skip = (pagination.page - 1) * pagination.limit;
    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    pipeline.push({ $limit: pagination.limit });

    // Project only needed fields for better performance
    pipeline.push({
      $project: {
        title: 1,
        description: 1,
        disasterType: 1,
        targetAmount: 1,
        totalDonated: 1,
        location: 1,
        policySnapshot: 1,
        transparencyScore: 1,
        proofCount: 1,
        proofVerifiedCount: 1,
        trustScore: 1,
        status: 1, // Include status field for validation
        createdAt: 1,
        endDate: 1,
        fundingProgress: 1,
        ngoName: needsNGOLookup ? 1 : "$createdBy", // Include ngoName only if lookup was done
        ngoVerificationStatus: needsNGOLookup ? 1 : undefined,
        createdBy: 1,
      },
    });

    return pipeline;
  }

  /**
   * Get optimized total count with better performance
   * @param {Object} filters - Validated filters
   * @returns {Number} - Total count
   */
  async getTotalCountOptimized(filters) {
    try {
      // Use a simpler aggregation for count to improve performance
      const matchStage = {
        status: CAMPAIGN_STATUS.ACTIVE,
      };

      // Apply only the most essential filters for counting
      if (filters.disasterType) {
        matchStage.disasterType = Array.isArray(filters.disasterType)
          ? { $in: filters.disasterType }
          : filters.disasterType;
      }

      if (filters.location) {
        matchStage.$or = [
          { "location.state": { $regex: filters.location, $options: "i" } },
          { "location.district": { $regex: filters.location, $options: "i" } },
          { "location.ward": { $regex: filters.location, $options: "i" } },
          { title: { $regex: filters.location, $options: "i" } },
        ];
      }

      if (filters.search) {
        matchStage.$or = [
          { title: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
        ];
      }

      // Use countDocuments for simple queries, aggregation for complex ones
      const hasComplexFilters =
        filters.ngoVerificationStatus ||
        filters.fundingProgressMin !== undefined ||
        filters.fundingProgressMax !== undefined ||
        filters.trustScoreMin !== undefined ||
        filters.trustScoreMax !== undefined;

      if (!hasComplexFilters) {
        // Simple count for better performance
        return await Campaign.countDocuments(matchStage);
      }

      // Use aggregation for complex filters
      const pipeline = [{ $match: matchStage }];

      // Add NGO lookup if needed
      if (
        filters.ngoVerificationStatus &&
        filters.ngoVerificationStatus.length > 0
      ) {
        pipeline.push({
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "ngo",
            pipeline: [{ $project: { verificationStatus: 1 } }],
          },
        });
        pipeline.push({ $unwind: "$ngo" });
        pipeline.push({
          $match: {
            "ngo.verificationStatus": { $in: filters.ngoVerificationStatus },
          },
        });
      }

      pipeline.push({ $count: "total" });

      const result = await Campaign.aggregate(pipeline);
      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error(
        "[CampaignDiscoveryService] Error in getTotalCountOptimized:",
        error,
      );
      // Fallback to simple count
      return await Campaign.countDocuments({ status: CAMPAIGN_STATUS.ACTIVE });
    }
  }
}

export default new CampaignDiscoveryService();
