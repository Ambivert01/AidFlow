/**
 * Trust Score History Service for Donor Tracking System
 * Retrieves and tracks trust score evolution over time
 */

import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { User } from "../../models/auth/User.model.js";
import trustEngine from "../../engines/trust.engine.js";

/**
 * Get trust score history for a campaign
 * @param {String} campaignId - Campaign ID
 * @param {Object} options - Query options
 * @returns {Array} - Trust score history with timestamps
 */
export const getCampaignTrustHistory = async (campaignId, options = {}) => {
  try {
    // Get current trust score
    const campaign = await Campaign.findById(campaignId)
      .select("trustScore")
      .lean();

    if (!campaign) {
      return [];
    }

    // Get trust score updates from audit logs
    const trustUpdates = await AuditLog.find({
      campaignId,
      eventType: "TRUST_SCORE_UPDATED",
    })
      .sort({ createdAt: 1 })
      .limit(options.limit || 100)
      .lean();

    const history = [];

    // Add historical trust scores from audit logs
    for (const update of trustUpdates) {
      if (update.payload?.trustScore !== undefined) {
        history.push({
          score: update.payload.trustScore,
          factors: update.payload.factors || {},
          timestamp: update.createdAt,
          change: update.payload.change || 0,
          reason: update.payload.reason || null,
        });
      }
    }

    // If no history exists, calculate current trust score
    if (history.length === 0 && campaign.trustScore) {
      const trustResult = await trustEngine.calculateTrustScore(
        campaignId,
        "CAMPAIGN",
      );

      history.push({
        score: trustResult.score,
        factors: trustResult.factors,
        timestamp: new Date(),
        change: 0,
        reason: "Current trust score",
      });
    }

    return history;
  } catch (error) {
    console.error(
      "[TrustHistory] Error fetching campaign trust history:",
      error,
    );
    return [];
  }
};

/**
 * Get trust score history for an NGO
 * @param {String} ngoId - NGO user ID
 * @param {Object} options - Query options
 * @returns {Array} - Trust score history with timestamps
 */
export const getNGOTrustHistory = async (ngoId, options = {}) => {
  try {
    // Get current trust score
    const ngo = await User.findById(ngoId).select("trustScore").lean();

    if (!ngo) {
      return [];
    }

    // Get trust score updates from audit logs
    const trustUpdates = await AuditLog.find({
      "actor.userId": ngoId,
      eventType: "TRUST_SCORE_UPDATED",
    })
      .sort({ createdAt: 1 })
      .limit(options.limit || 100)
      .lean();

    const history = [];

    // Add historical trust scores from audit logs
    for (const update of trustUpdates) {
      if (update.payload?.trustScore !== undefined) {
        history.push({
          score: update.payload.trustScore,
          factors: update.payload.factors || {},
          timestamp: update.createdAt,
          change: update.payload.change || 0,
          reason: update.payload.reason || null,
        });
      }
    }

    // If no history exists, calculate current trust score
    if (history.length === 0 && ngo.trustScore) {
      const trustResult = await trustEngine.calculateTrustScore(ngoId, "NGO");

      history.push({
        score: trustResult.score,
        factors: trustResult.factors,
        timestamp: new Date(),
        change: 0,
        reason: "Current trust score",
      });
    }

    return history;
  } catch (error) {
    console.error("[TrustHistory] Error fetching NGO trust history:", error);
    return [];
  }
};

/**
 * Get trust score change delta between two timestamps
 * @param {Array} history - Trust score history
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} - Trust score change summary
 */
export const getTrustScoreChange = (history, startDate, endDate) => {
  if (!history || history.length === 0) {
    return {
      startScore: null,
      endScore: null,
      change: 0,
      percentChange: 0,
    };
  }

  // Find scores at start and end dates
  const startScore =
    history.find((h) => new Date(h.timestamp) >= new Date(startDate))?.score ||
    history[0].score;

  const endScore =
    history
      .slice()
      .reverse()
      .find((h) => new Date(h.timestamp) <= new Date(endDate))?.score ||
    history[history.length - 1].score;

  const change = endScore - startScore;
  const percentChange = startScore > 0 ? (change / startScore) * 100 : 0;

  return {
    startScore,
    endScore,
    change,
    percentChange: Math.round(percentChange * 10) / 10,
  };
};

/**
 * Detect significant trust score changes (>10 points)
 * @param {Array} history - Trust score history
 * @returns {Array} - Significant changes
 */
export const detectSignificantChanges = (history) => {
  if (!history || history.length < 2) {
    return [];
  }

  const significantChanges = [];

  for (let i = 1; i < history.length; i++) {
    const current = history[i];
    const previous = history[i - 1];
    const change = current.score - previous.score;

    if (Math.abs(change) > 10) {
      significantChanges.push({
        timestamp: current.timestamp,
        previousScore: previous.score,
        newScore: current.score,
        change,
        reason: current.reason,
        isIncrease: change > 0,
        isDecrease: change < 0,
      });
    }
  }

  return significantChanges;
};

/**
 * Get trust score factor breakdown for a specific timestamp
 * @param {Array} history - Trust score history
 * @param {Date} timestamp - Timestamp to query
 * @returns {Object|null} - Trust score factors
 */
export const getTrustScoreFactorsAt = (history, timestamp) => {
  if (!history || history.length === 0) {
    return null;
  }

  // Find the closest trust score entry before or at the timestamp
  const entry = history
    .slice()
    .reverse()
    .find((h) => new Date(h.timestamp) <= new Date(timestamp));

  return entry?.factors || null;
};

/**
 * Format trust score history for chart display
 * @param {Array} history - Trust score history
 * @returns {Object} - Formatted data for charts
 */
export const formatTrustHistoryForChart = (history) => {
  if (!history || history.length === 0) {
    return {
      labels: [],
      scores: [],
      factors: {
        proofScore: [],
        aiScore: [],
        timelinessScore: [],
        fraudPenalty: [],
        consistencyScore: [],
      },
    };
  }

  const labels = history.map((h) =>
    new Date(h.timestamp).toLocaleDateString("en-IN"),
  );

  const scores = history.map((h) => h.score);

  const factors = {
    proofScore: history.map((h) => h.factors?.proofScore || 0),
    aiScore: history.map((h) => h.factors?.aiScore || 0),
    timelinessScore: history.map((h) => h.factors?.timelinessScore || 0),
    fraudPenalty: history.map((h) => h.factors?.fraudPenalty || 0),
    consistencyScore: history.map((h) => h.factors?.consistencyScore || 0),
  };

  return {
    labels,
    scores,
    factors,
  };
};

/**
 * Get trust score statistics
 * @param {Array} history - Trust score history
 * @returns {Object} - Trust score statistics
 */
export const getTrustScoreStatistics = (history) => {
  if (!history || history.length === 0) {
    return {
      current: null,
      average: null,
      min: null,
      max: null,
      trend: "STABLE",
    };
  }

  const scores = history.map((h) => h.score);
  const current = scores[scores.length - 1];
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // Determine trend (last 5 data points)
  let trend = "STABLE";
  if (history.length >= 5) {
    const recent = scores.slice(-5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg =
      scores.slice(-10, -5).reduce((a, b) => a + b, 0) / 5 || recentAvg;

    if (recentAvg > previousAvg + 5) {
      trend = "INCREASING";
    } else if (recentAvg < previousAvg - 5) {
      trend = "DECREASING";
    }
  }

  return {
    current: Math.round(current),
    average: Math.round(average),
    min: Math.round(min),
    max: Math.round(max),
    trend,
  };
};

/**
 * Get trust score color based on value
 * @param {Number} score - Trust score (0-100)
 * @returns {String} - Color code (success, warning, danger)
 */
export const getTrustScoreColor = (score) => {
  if (score >= 80) {
    return "success"; // Green
  }

  if (score >= 60) {
    return "warning"; // Yellow
  }

  return "danger"; // Red
};

/**
 * Get trust score label based on value
 * @param {Number} score - Trust score (0-100)
 * @returns {String} - Trust level label
 */
export const getTrustScoreLabel = (score) => {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 80) {
    return "Very Good";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 60) {
    return "Fair";
  }

  if (score >= 50) {
    return "Poor";
  }

  return "Very Poor";
};
