/**
 * Timeline Cache Manager for Donor Tracking System
 * Manages Redis-based caching for timeline data with TTL and invalidation
 */

import { redisConnection } from "../../config/redis.config.js";
import { TIMELINE_CACHE_CONFIG } from "./donation.timeline.constants.js";

class TimelineCacheManager {
  constructor() {
    this.redis = redisConnection;
    this.ttl = TIMELINE_CACHE_CONFIG.TTL;
    this.keyPrefix = TIMELINE_CACHE_CONFIG.KEY_PREFIX;

    // Cache hit/miss tracking
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    };
  }

  /**
   * Get cache key for donation timeline
   * @param {String} donationId - Donation ID
   * @param {Object} options - Filter and pagination options
   * @returns {String} - Cache key
   */
  getCacheKey(donationId, options = {}) {
    // Include filter options in cache key for unique caching
    const optionsKey = JSON.stringify({
      eventType: options.eventType || null,
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      actorRole: options.actorRole || null,
      search: options.search || null,
      page: options.page || 1,
      pageSize: options.pageSize || 50,
    });

    const hash = this.hashOptions(optionsKey);
    return `${this.keyPrefix}${donationId}:${hash}`;
  }

  /**
   * Hash options string for cache key
   * @param {String} optionsStr - Options JSON string
   * @returns {String} - Hash
   */
  hashOptions(optionsStr) {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < optionsStr.length; i++) {
      const char = optionsStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get timeline from cache
   * @param {String} donationId - Donation ID
   * @param {Object} options - Filter and pagination options
   * @returns {Object|null} - Cached timeline or null
   */
  async get(donationId, options = {}) {
    try {
      const cacheKey = this.getCacheKey(donationId, options);
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        this.stats.hits++;
        console.log(`[TimelineCache] Cache HIT for donation ${donationId}`);
        return JSON.parse(cached);
      }

      this.stats.misses++;
      console.log(`[TimelineCache] Cache MISS for donation ${donationId}`);
      return null;
    } catch (error) {
      console.error("[TimelineCache] Error getting from cache:", error);
      this.stats.errors = (this.stats.errors || 0) + 1;
      // Return null to allow fallback to database
      return null;
    }
  }

  /**
   * Set timeline in cache
   * @param {String} donationId - Donation ID
   * @param {Object} timeline - Timeline data
   * @param {Object} options - Filter and pagination options
   * @returns {Boolean} - Success status
   */
  async set(donationId, timeline, options = {}) {
    try {
      const cacheKey = this.getCacheKey(donationId, options);
      await this.redis.setex(cacheKey, this.ttl, JSON.stringify(timeline));
      console.log(
        `[TimelineCache] Cached timeline for donation ${donationId} (TTL: ${this.ttl}s)`,
      );
      return true;
    } catch (error) {
      console.error("[TimelineCache] Error setting cache:", error);
      this.stats.errors = (this.stats.errors || 0) + 1;
      // Don't throw - caching failure should not break the app
      return false;
    }
  }

  /**
   * Invalidate all cached timelines for a donation
   * @param {String} donationId - Donation ID
   * @returns {Number} - Number of keys deleted
   */
  async invalidate(donationId) {
    try {
      // Find all cache keys for this donation
      const pattern = `${this.keyPrefix}${donationId}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        console.log(
          `[TimelineCache] No cache entries to invalidate for donation ${donationId}`,
        );
        return 0;
      }

      // Delete all matching keys
      const deleted = await this.redis.del(...keys);
      this.stats.invalidations++;

      console.log(
        `[TimelineCache] Invalidated ${deleted} cache entries for donation ${donationId}`,
      );
      return deleted;
    } catch (error) {
      console.error("[TimelineCache] Error invalidating cache:", error);
      return 0;
    }
  }

  /**
   * Invalidate cache for multiple donations
   * @param {Array} donationIds - Array of donation IDs
   * @returns {Number} - Total number of keys deleted
   */
  async invalidateMultiple(donationIds) {
    try {
      let totalDeleted = 0;

      for (const donationId of donationIds) {
        const deleted = await this.invalidate(donationId);
        totalDeleted += deleted;
      }

      return totalDeleted;
    } catch (error) {
      console.error(
        "[TimelineCache] Error invalidating multiple caches:",
        error,
      );
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats with hit rate
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      errors: this.stats.errors || 0,
      total,
      hitRate: hitRate.toFixed(2) + "%",
      invalidations: this.stats.invalidations,
      targetHitRate:
        (TIMELINE_CACHE_CONFIG.HIT_RATE_TARGET * 100).toFixed(0) + "%",
      meetsTarget: hitRate >= TIMELINE_CACHE_CONFIG.HIT_RATE_TARGET * 100,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      errors: 0,
    };
    console.log("[TimelineCache] Cache statistics reset");
  }

  /**
   * Clear all timeline caches (use with caution)
   * @returns {Number} - Number of keys deleted
   */
  async clearAll() {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        console.log("[TimelineCache] No cache entries to clear");
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      console.log(`[TimelineCache] Cleared ${deleted} cache entries`);
      return deleted;
    } catch (error) {
      console.error("[TimelineCache] Error clearing cache:", error);
      return 0;
    }
  }

  /**
   * Get cache TTL for a specific donation
   * @param {String} donationId - Donation ID
   * @param {Object} options - Filter and pagination options
   * @returns {Number} - TTL in seconds, -1 if key doesn't exist, -2 if no expiry
   */
  async getTTL(donationId, options = {}) {
    try {
      const cacheKey = this.getCacheKey(donationId, options);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      console.error("[TimelineCache] Error getting TTL:", error);
      return -1;
    }
  }

  /**
   * Check if cache exists for donation
   * @param {String} donationId - Donation ID
   * @param {Object} options - Filter and pagination options
   * @returns {Boolean} - True if cache exists
   */
  async exists(donationId, options = {}) {
    try {
      const cacheKey = this.getCacheKey(donationId, options);
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error("[TimelineCache] Error checking cache existence:", error);
      return false;
    }
  }
}

// Export singleton instance
export default new TimelineCacheManager();
