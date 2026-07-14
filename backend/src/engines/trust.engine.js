import { Proof } from "../models/proofs/Proof.model.js";
import { AIDecisionLog } from "../models/system/AIDecisionLog.model.js";
import { FraudAlert } from "../models/governance/FraudAlert.model.js";
import { AuditLog } from "../models/audit/AuditLog.model.js";
import { Campaign } from "../models/ngo/Campaign.model.js";
import { User } from "../models/auth/User.model.js";
import { Merchant } from "../models/merchant/Merchant.model.js";
import { redisConnection } from "../config/redis.config.js";

class TrustEngine {
  constructor() {
    this.redis = redisConnection;
    this.TRUST_CACHE_TTL = 60 * 60; // 1 hour cache for trust scores
  }
  /**
   * Calculate trust score for an entity
   * @param {String} entityId - MongoDB ObjectId as string
   * @param {String} entityType - "NGO", "CAMPAIGN", or "MERCHANT"
   * @returns {Object} - { score, factors }
   */
  async calculateTrustScore(entityId, entityType) {
    try {
      const factors = await this.aggregateFactors(entityId, entityType);

      // Apply weighted formula
      const score = this.applyFormula(factors);

      return {
        score: Math.round(score),
        factors,
      };
    } catch (error) {
      console.error(
        `[TrustEngine] Error calculating trust for ${entityType}:${entityId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Calculate trust scores for multiple entities efficiently (batch processing)
   * @param {Array} entityIds - Array of entity IDs
   * @param {String} entityType - "NGO", "CAMPAIGN", or "MERCHANT"
   * @returns {Object} - Map of entityId -> { score, factors }
   */
  async calculateBatchTrustScores(entityIds, entityType = "CAMPAIGN") {
    if (!entityIds || entityIds.length === 0) {
      return {};
    }

    try {
      console.log(
        `[TrustEngine] Calculating batch trust scores for ${entityIds.length} ${entityType}s`,
      );

      const results = {};
      const batchSize = 10; // Process in batches to avoid overwhelming the system

      // Process entities in batches
      for (let i = 0; i < entityIds.length; i += batchSize) {
        const batch = entityIds.slice(i, i + batchSize);

        const batchPromises = batch.map(async (entityId) => {
          try {
            const result = await this.calculateTrustScore(entityId, entityType);
            return { entityId, result };
          } catch (error) {
            console.warn(
              `[TrustEngine] Failed to calculate trust for ${entityType}:${entityId}`,
              error,
            );
            return { entityId, result: { score: 50, factors: {} } }; // Default neutral score
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((promiseResult) => {
          if (promiseResult.status === "fulfilled") {
            const { entityId, result } = promiseResult.value;
            results[entityId] = result;
          }
        });
      }

      console.log(
        `[TrustEngine] Completed batch calculation for ${Object.keys(results).length} entities`,
      );
      return results;
    } catch (error) {
      console.error(
        `[TrustEngine] Error in batch trust score calculation:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get cached trust score or calculate if expired
   * @param {String} entityId - Entity ID
   * @param {String} entityType - Entity type
   * @returns {Object|null} - Trust score result or null if not cached
   */
  async getCachedTrustScore(entityId, entityType) {
    try {
      const cacheKey = `trust:${entityType.toLowerCase()}:${entityId}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        const result = JSON.parse(cached);
        console.log(`[TrustEngine] Cache hit for ${entityType}:${entityId}`);
        return result;
      }

      console.log(`[TrustEngine] Cache miss for ${entityType}:${entityId}`);
      return null;
    } catch (error) {
      console.warn(
        `[TrustEngine] Cache error for ${entityType}:${entityId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Cache trust score result
   * @param {String} entityId - Entity ID
   * @param {String} entityType - Entity type
   * @param {Object} result - Trust score result to cache
   */
  async cacheTrustScore(entityId, entityType, result) {
    try {
      const cacheKey = `trust:${entityType.toLowerCase()}:${entityId}`;
      await this.redis.setex(
        cacheKey,
        this.TRUST_CACHE_TTL,
        JSON.stringify(result),
      );
      console.log(
        `[TrustEngine] Cached trust score for ${entityType}:${entityId}`,
      );
    } catch (error) {
      console.warn(
        `[TrustEngine] Failed to cache trust score for ${entityType}:${entityId}:`,
        error,
      );
    }
  }

  /**
   * Invalidate trust score cache when underlying data changes
   * @param {String} entityId - Entity ID
   * @param {String} entityType - Entity type
   */
  async invalidateTrustCache(entityId, entityType) {
    try {
      const cacheKey = `trust:${entityType.toLowerCase()}:${entityId}`;
      await this.redis.del(cacheKey);
      console.log(
        `[TrustEngine] Invalidated trust cache for ${entityType}:${entityId}`,
      );
    } catch (error) {
      console.warn(
        `[TrustEngine] Failed to invalidate trust cache for ${entityType}:${entityId}:`,
        error,
      );
    }
  }

  /**
   * Get trust scores for multiple entities with caching
   * @param {Array} entityIds - Array of entity IDs
   * @param {String} entityType - Entity type
   * @returns {Object} - Map of entityId -> score (number only)
   */
  async getBatchTrustScoresWithCache(entityIds, entityType = "CAMPAIGN") {
    if (!entityIds || entityIds.length === 0) {
      return {};
    }

    try {
      const results = {};
      const uncachedIds = [];

      // Check cache for all entities first
      for (const entityId of entityIds) {
        const cached = await this.getCachedTrustScore(entityId, entityType);
        if (cached && cached.score !== undefined) {
          results[entityId] = cached.score;
        } else {
          uncachedIds.push(entityId);
        }
      }

      // Calculate trust scores for uncached entities
      if (uncachedIds.length > 0) {
        console.log(
          `[TrustEngine] Calculating ${uncachedIds.length} uncached trust scores`,
        );
        const calculated = await this.calculateBatchTrustScores(
          uncachedIds,
          entityType,
        );

        // Cache the calculated results and add to results
        for (const [entityId, trustResult] of Object.entries(calculated)) {
          await this.cacheTrustScore(entityId, entityType, trustResult);
          results[entityId] = trustResult.score;
        }
      }

      return results;
    } catch (error) {
      console.error(
        `[TrustEngine] Error in getBatchTrustScoresWithCache:`,
        error,
      );
      // Return empty object on error - calling code should handle gracefully
      return {};
    }
  }

  /**
   * Aggregate all trust factors for an entity
   */
  async aggregateFactors(entityId, entityType) {
    const [
      proofScore,
      aiScore,
      timelinessScore,
      fraudPenalty,
      consistencyScore,
    ] = await Promise.all([
      this.calculateProofScore(entityId, entityType),
      this.calculateAIScore(entityId, entityType),
      this.calculateTimelinessScore(entityId, entityType),
      this.calculateFraudPenalty(entityId, entityType),
      this.calculateConsistencyScore(entityId, entityType),
    ]);

    return {
      proofScore,
      aiScore,
      timelinessScore,
      fraudPenalty,
      consistencyScore,
    };
  }

  /**
   * Apply weighted formula to calculate final trust score
   */
  applyFormula(factors) {
    const {
      proofScore,
      aiScore,
      timelinessScore,
      fraudPenalty,
      consistencyScore,
    } = factors;

    const score =
      proofScore * 0.4 +
      aiScore * 0.25 +
      timelinessScore * 0.15 +
      fraudPenalty * 0.1 +
      consistencyScore * 0.1;

    // Normalize to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * FACTOR 1: Proof Validation Score (40% weight)
   * Verified proofs increase, rejected proofs decrease
   */
  async calculateProofScore(entityId, entityType) {
    try {
      let campaignIds = [];

      if (entityType === "NGO") {
        const campaigns = await Campaign.find({ createdBy: entityId }).select(
          "_id",
        );
        campaignIds = campaigns.map((c) => c._id);
      } else if (entityType === "CAMPAIGN") {
        campaignIds = [entityId];
      } else if (entityType === "MERCHANT") {
        // Merchant proof score based on proofs related to their transactions
        const proofs = await Proof.find({ merchant: entityId });
        const verified = proofs.filter((p) => p.status === "APPROVED").length;
        const rejected = proofs.filter((p) => p.status === "REJECTED").length;
        const total = proofs.length;

        if (total === 0) return 50; // Neutral for new merchants

        const verificationRate = verified / total;
        const rejectionRate = rejected / total;

        return Math.round(verificationRate * 100 - rejectionRate * 30);
      }

      if (campaignIds.length === 0) return 50; // Neutral for new entities

      const proofs = await Proof.find({ campaign: { $in: campaignIds } });

      const verified = proofs.filter((p) => p.status === "APPROVED").length;
      const rejected = proofs.filter((p) => p.status === "REJECTED").length;
      const total = proofs.length;

      if (total === 0) return 50; // Neutral score for no proofs

      const verificationRate = verified / total;
      const rejectionRate = rejected / total;

      // High verification rate increases score, rejections decrease it
      const score = verificationRate * 100 - rejectionRate * 30;

      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (error) {
      console.error("[TrustEngine] Error calculating proof score:", error);
      return 50; // Default neutral score on error
    }
  }

  /**
   * FACTOR 2: AI Risk Score (25% weight)
   * High fraud risk decreases, clean history increases
   */
  async calculateAIScore(entityId, entityType) {
    try {
      let query = {};

      if (entityType === "NGO") {
        const campaigns = await Campaign.find({ createdBy: entityId }).select(
          "_id",
        );
        const campaignIds = campaigns.map((c) => c._id);
        query = { campaign: { $in: campaignIds } };
      } else if (entityType === "CAMPAIGN") {
        query = { campaign: entityId };
      } else if (entityType === "MERCHANT") {
        query = { entityType: "Merchant", entityId: entityId.toString() };
      }

      const aiLogs = await AIDecisionLog.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      if (aiLogs.length === 0) return 50; // Neutral for no AI decisions

      // Calculate average risk score (lower is better)
      const avgRiskScore =
        aiLogs.reduce((sum, log) => sum + (log.riskScore || 0), 0) /
        aiLogs.length;

      // Invert risk score to trust score (high risk = low trust)
      const trustScore = 100 - avgRiskScore;

      return Math.max(0, Math.min(100, Math.round(trustScore)));
    } catch (error) {
      console.error("[TrustEngine] Error calculating AI score:", error);
      return 50; // Default neutral score on error
    }
  }

  /**
   * FACTOR 3: Timeliness Score (15% weight)
   * Delayed proofs decrease, on-time updates increase
   */
  async calculateTimelinessScore(entityId, entityType) {
    try {
      let campaignIds = [];

      if (entityType === "NGO") {
        const campaigns = await Campaign.find({ createdBy: entityId }).select(
          "_id",
        );
        campaignIds = campaigns.map((c) => c._id);
      } else if (entityType === "CAMPAIGN") {
        campaignIds = [entityId];
      } else if (entityType === "MERCHANT") {
        // Merchant timeliness based on transaction processing speed
        const auditLogs = await AuditLog.find({
          entityType: "Merchant",
          entityId: entityId.toString(),
          eventType: { $in: ["TRANSACTION_COMPLETED", "SETTLEMENT_PROCESSED"] },
        })
          .sort({ createdAt: -1 })
          .limit(20);

        if (auditLogs.length === 0) return 50; // Neutral for new merchants

        // Assume timely if logs exist (simplified)
        return 75;
      }

      if (campaignIds.length === 0) return 50;

      const proofs = await Proof.find({ campaign: { $in: campaignIds } })
        .sort({ createdAt: -1 })
        .limit(50);

      if (proofs.length === 0) return 50;

      // Calculate average time between capture and upload
      let totalDelay = 0;
      let count = 0;

      proofs.forEach((proof) => {
        if (proof.capturedAt && proof.createdAt) {
          const delayHours =
            (proof.createdAt - proof.capturedAt) / (1000 * 60 * 60);
          totalDelay += delayHours;
          count++;
        }
      });

      if (count === 0) return 50;

      const avgDelayHours = totalDelay / count;

      // Score based on average delay
      // < 24 hours = 100, > 7 days = 0
      let score = 100;
      if (avgDelayHours > 24) {
        score = Math.max(0, 100 - (avgDelayHours - 24) * 5);
      }

      return Math.round(score);
    } catch (error) {
      console.error("[TrustEngine] Error calculating timeliness score:", error);
      return 50;
    }
  }

  /**
   * FACTOR 4: Fraud Penalty (10% weight)
   * Fraud alerts decrease score
   */
  async calculateFraudPenalty(entityId, entityType) {
    try {
      let query = {};

      if (entityType === "NGO") {
        const campaigns = await Campaign.find({ createdBy: entityId }).select(
          "_id",
        );
        const campaignIds = campaigns.map((c) => c._id);
        query = { campaign: { $in: campaignIds } };
      } else if (entityType === "CAMPAIGN") {
        query = { campaign: entityId };
      } else if (entityType === "MERCHANT") {
        query = { entityType: "MERCHANT", entityId: entityId.toString() };
      }

      const fraudAlerts = await FraudAlert.find(query);

      if (fraudAlerts.length === 0) return 100; // No fraud = full score

      // Count by severity
      const critical = fraudAlerts.filter(
        (a) => a.severity === "CRITICAL",
      ).length;
      const high = fraudAlerts.filter((a) => a.severity === "HIGH").length;
      const medium = fraudAlerts.filter((a) => a.severity === "MEDIUM").length;
      const low = fraudAlerts.filter((a) => a.severity === "LOW").length;

      // Calculate penalty
      const penalty = critical * 30 + high * 20 + medium * 10 + low * 5;

      const score = Math.max(0, 100 - penalty);

      return Math.round(score);
    } catch (error) {
      console.error("[TrustEngine] Error calculating fraud penalty:", error);
      return 100; // Default to no penalty on error
    }
  }

  /**
   * FACTOR 5: Consistency Score (10% weight)
   * Regular activity increases score
   */
  async calculateConsistencyScore(entityId, entityType) {
    try {
      let query = {};

      if (entityType === "NGO") {
        const campaigns = await Campaign.find({ createdBy: entityId }).select(
          "_id",
        );
        const campaignIds = campaigns.map((c) => c._id);
        query = { campaign: { $in: campaignIds } };
      } else if (entityType === "CAMPAIGN") {
        query = { campaign: entityId };
      } else if (entityType === "MERCHANT") {
        query = { entityType: "Merchant", entityId: entityId.toString() };
      }

      // Check audit logs for activity consistency
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const auditLogs = await AuditLog.find({
        ...query,
        createdAt: { $gte: thirtyDaysAgo },
      }).sort({ createdAt: 1 });

      if (auditLogs.length === 0) return 50; // Neutral for new entities

      // Calculate activity distribution across days
      const activityByDay = {};
      auditLogs.forEach((log) => {
        const day = log.createdAt.toISOString().split("T")[0];
        activityByDay[day] = (activityByDay[day] || 0) + 1;
      });

      const activeDays = Object.keys(activityByDay).length;

      // Score based on number of active days in last 30 days
      // 20+ days = 100, 10 days = 50, < 5 days = 25
      let score = 50;
      if (activeDays >= 20) score = 100;
      else if (activeDays >= 15) score = 85;
      else if (activeDays >= 10) score = 70;
      else if (activeDays >= 5) score = 50;
      else score = 25;

      return Math.round(score);
    } catch (error) {
      console.error(
        "[TrustEngine] Error calculating consistency score:",
        error,
      );
      return 50;
    }
  }

  /**
   * Get entity model and field based on entity type
   */
  getEntityModel(entityType) {
    switch (entityType) {
      case "NGO":
        return { model: User, field: "trustScore" };
      case "CAMPAIGN":
        return { model: Campaign, field: "trustScore" };
      case "MERCHANT":
        return { model: Merchant, field: "trustScore" };
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}

export default new TrustEngine();
