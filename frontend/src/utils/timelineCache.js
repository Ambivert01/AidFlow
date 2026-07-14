/**
 * Timeline Cache Utility
 *
 * Provides browser storage caching for timeline data to enable offline viewing
 * and improve performance by reducing API calls.
 *
 * Features:
 * - localStorage-based caching with TTL
 * - Automatic cache invalidation
 * - Cache size management
 * - Offline support
 */

const CACHE_PREFIX = "timeline_cache_";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 50; // Maximum number of cached timelines

/**
 * Generate cache key for a timeline
 */
const getCacheKey = (donationId, filters = {}, page = 1) => {
  const filterStr = JSON.stringify(filters);
  return `${CACHE_PREFIX}${donationId}_${filterStr}_${page}`;
};

/**
 * Get cached timeline data
 */
export const getCachedTimeline = (donationId, filters = {}, page = 1) => {
  try {
    const key = getCacheKey(donationId, filters, page);
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
};

/**
 * Set timeline data in cache
 */
export const setCachedTimeline = (donationId, filters = {}, page = 1, data) => {
  try {
    const key = getCacheKey(donationId, filters, page);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(cacheEntry));

    // Manage cache size
    manageCacheSize();
  } catch (error) {
    console.error("Error writing to cache:", error);
    // If localStorage is full, clear old entries
    if (error.name === "QuotaExceededError") {
      clearOldestCacheEntries(10);
      // Try again
      try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
      } catch (retryError) {
        console.error("Failed to cache after cleanup:", retryError);
      }
    }
  }
};

/**
 * Invalidate cache for a specific donation
 */
export const invalidateTimelineCache = (donationId) => {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `${CACHE_PREFIX}${donationId}_`;

    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
  }
};

/**
 * Clear all timeline caches
 */
export const clearAllTimelineCaches = () => {
  try {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing caches:", error);
  }
};

/**
 * Manage cache size by removing oldest entries
 */
const manageCacheSize = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    if (cacheKeys.length > MAX_CACHE_SIZE) {
      clearOldestCacheEntries(cacheKeys.length - MAX_CACHE_SIZE);
    }
  } catch (error) {
    console.error("Error managing cache size:", error);
  }
};

/**
 * Clear oldest cache entries
 */
const clearOldestCacheEntries = (count) => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    // Get timestamps for all cache entries
    const entries = cacheKeys
      .map((key) => {
        try {
          const cached = localStorage.getItem(key);
          const { timestamp } = JSON.parse(cached);
          return { key, timestamp };
        } catch {
          return { key, timestamp: 0 };
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries
    entries.slice(0, count).forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Error clearing oldest entries:", error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    let totalSize = 0;
    let validEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();

    cacheKeys.forEach((key) => {
      try {
        const cached = localStorage.getItem(key);
        totalSize += cached.length;

        const { timestamp } = JSON.parse(cached);
        if (now - timestamp > CACHE_TTL) {
          expiredEntries++;
        } else {
          validEntries++;
        }
      } catch {
        // Ignore invalid entries
      }
    });

    return {
      totalEntries: cacheKeys.length,
      validEntries,
      expiredEntries,
      totalSize,
      maxSize: MAX_CACHE_SIZE,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return null;
  }
};

/**
 * Check if browser storage is available
 */
export const isStorageAvailable = () => {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};
