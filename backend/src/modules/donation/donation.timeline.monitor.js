/**
 * Performance Monitoring for Timeline Service
 * Tracks response times, cache hit rates, and database query counts
 */

import { TIMELINE_PERFORMANCE } from "./donation.timeline.constants.js";

class TimelinePerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      slowQueries: [],
      alerts: [],
      dbQueryCounts: [],
      errors: 0,
    };
  }

  /**
   * Record timeline request metrics
   * @param {Number} responseTime - Response time in milliseconds
   * @param {Number} dbQueryCount - Number of database queries
   * @param {String} donationId - Donation ID
   */
  recordRequest(responseTime, dbQueryCount, donationId) {
    try {
      // Validate inputs
      if (typeof responseTime !== "number" || responseTime < 0) {
        console.warn("[TimelineMonitor] Invalid responseTime:", responseTime);
        this.metrics.errors++;
        return;
      }

      if (typeof dbQueryCount !== "number" || dbQueryCount < 0) {
        console.warn("[TimelineMonitor] Invalid dbQueryCount:", dbQueryCount);
        this.metrics.errors++;
        return;
      }

      this.metrics.requests++;
      this.metrics.totalResponseTime += responseTime;

      // Track slow queries
      if (responseTime > TIMELINE_PERFORMANCE.SLOW_QUERY_THRESHOLD) {
        this.metrics.slowQueries.push({
          donationId,
          responseTime,
          timestamp: new Date(),
        });

        console.warn(
          `[TimelineMonitor] Slow query detected: ${responseTime}ms for donation ${donationId}`,
        );
      }

      // Alert if response time exceeds threshold
      if (responseTime > TIMELINE_PERFORMANCE.ALERT_RESPONSE_TIME) {
        const alert = {
          type: "SLOW_RESPONSE",
          message: `Timeline response time exceeded ${TIMELINE_PERFORMANCE.ALERT_RESPONSE_TIME}ms`,
          responseTime,
          donationId,
          timestamp: new Date(),
        };

        this.metrics.alerts.push(alert);
        console.error(`[TimelineMonitor] ALERT: ${alert.message}`, alert);
      }

      // Track database query count
      this.metrics.dbQueryCounts.push(dbQueryCount);

      // Alert if query count exceeds threshold
      if (dbQueryCount > TIMELINE_PERFORMANCE.MAX_DB_QUERIES) {
        const alert = {
          type: "EXCESSIVE_QUERIES",
          message: `Timeline request exceeded ${TIMELINE_PERFORMANCE.MAX_DB_QUERIES} database queries`,
          queryCount: dbQueryCount,
          donationId,
          timestamp: new Date(),
        };

        this.metrics.alerts.push(alert);
        console.error(`[TimelineMonitor] ALERT: ${alert.message}`, alert);
      }
    } catch (error) {
      console.error("[TimelineMonitor] Error recording metrics:", error);
      this.metrics.errors++;
      // Don't throw - monitoring should not break the app
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getMetrics() {
    const avgResponseTime =
      this.metrics.requests > 0
        ? this.metrics.totalResponseTime / this.metrics.requests
        : 0;

    const avgDbQueries =
      this.metrics.dbQueryCounts.length > 0
        ? this.metrics.dbQueryCounts.reduce((a, b) => a + b, 0) /
          this.metrics.dbQueryCounts.length
        : 0;

    return {
      requests: this.metrics.requests,
      avgResponseTime: Math.round(avgResponseTime),
      targetResponseTime: TIMELINE_PERFORMANCE.TARGET_RESPONSE_TIME,
      meetsTarget: avgResponseTime <= TIMELINE_PERFORMANCE.TARGET_RESPONSE_TIME,
      slowQueries: this.metrics.slowQueries.length,
      slowQueryThreshold: TIMELINE_PERFORMANCE.SLOW_QUERY_THRESHOLD,
      avgDbQueries: Math.round(avgDbQueries * 10) / 10,
      maxDbQueries: TIMELINE_PERFORMANCE.MAX_DB_QUERIES,
      alerts: this.metrics.alerts.length,
      recentAlerts: this.metrics.alerts.slice(-10), // Last 10 alerts
    };
  }

  /**
   * Get slow queries
   * @param {Number} limit - Number of slow queries to return
   * @returns {Array} - Slow queries
   */
  getSlowQueries(limit = 10) {
    return this.metrics.slowQueries.slice(-limit);
  }

  /**
   * Get recent alerts
   * @param {Number} limit - Number of alerts to return
   * @returns {Array} - Recent alerts
   */
  getAlerts(limit = 10) {
    return this.metrics.alerts.slice(-limit);
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: 0,
      totalResponseTime: 0,
      slowQueries: [],
      alerts: [],
      dbQueryCounts: [],
      errors: 0,
    };
    console.log("[TimelineMonitor] Performance metrics reset");
  }

  /**
   * Get Prometheus-compatible metrics
   * @returns {String} - Prometheus metrics format
   */
  getPrometheusMetrics() {
    const metrics = this.getMetrics();

    return `
# HELP timeline_requests_total Total number of timeline requests
# TYPE timeline_requests_total counter
timeline_requests_total ${metrics.requests}

# HELP timeline_response_time_avg Average response time in milliseconds
# TYPE timeline_response_time_avg gauge
timeline_response_time_avg ${metrics.avgResponseTime}

# HELP timeline_slow_queries_total Total number of slow queries
# TYPE timeline_slow_queries_total counter
timeline_slow_queries_total ${metrics.slowQueries}

# HELP timeline_db_queries_avg Average number of database queries per request
# TYPE timeline_db_queries_avg gauge
timeline_db_queries_avg ${metrics.avgDbQueries}

# HELP timeline_alerts_total Total number of performance alerts
# TYPE timeline_alerts_total counter
timeline_alerts_total ${metrics.alerts}
`.trim();
  }
}

// Export singleton instance
export default new TimelinePerformanceMonitor();
