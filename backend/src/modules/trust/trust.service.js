import trustEngine from "../../engines/trust.engine.js";
import { TrustLog } from "../../models/system/TrustLog.model.js";
import { User } from "../../models/auth/User.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Merchant } from "../../models/merchant/Merchant.model.js";
import mongoose from "mongoose";

class TrustService {
  /**
   * Get current trust score for an entity
   */
  async getTrustScore(entityId, entityType) {
    const { model } = this.getEntityModel(entityType);

    const entity = await model.findById(entityId).select("trustScore");

    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    return {
      entityId,
      entityType,
      trustScore: entity.trustScore || 50,
    };
  }

  /**
   * Update trust score for an entity
   */
  async updateTrustScore(
    entityId,
    entityType,
    reason,
    triggerEvent,
    triggeredBy = null,
    session = null,
  ) {
    try {
      const { model } = this.getEntityModel(entityType);

      // Get current entity
      const entity = await model.findById(entityId).session(session);

      if (!entity) {
        throw new Error(`${entityType} not found`);
      }

      const oldScore = entity.trustScore || 50;

      // Calculate new trust score
      const { score: newScore, factors } =
        await trustEngine.calculateTrustScore(entityId, entityType);

      // Update entity
      entity.trustScore = newScore;
      await entity.save({ session });

      // Log the change
      await TrustLog.create(
        [
          {
            entityType,
            entityId,
            oldScore,
            newScore,
            delta: newScore - oldScore,
            reason,
            triggerEvent,
            factors,
            triggeredBy,
          },
        ],
        { session },
      );

      return {
        entityId,
        entityType,
        oldScore,
        newScore,
        delta: newScore - oldScore,
        factors,
      };
    } catch (error) {
      console.error(
        `[TrustService] Error updating trust score for ${entityType}:${entityId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get trust score history for an entity
   */
  async getTrustHistory(entityId, entityType, limit = 50) {
    const history = await TrustLog.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return history;
  }

  /**
   * Get trust score with detailed breakdown
   */
  async getTrustScoreDetailed(entityId, entityType) {
    const { model } = this.getEntityModel(entityType);

    const entity = await model.findById(entityId).select("trustScore");

    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    // Recalculate to get current factors
    const { score, factors } = await trustEngine.calculateTrustScore(
      entityId,
      entityType,
    );

    return {
      entityId,
      entityType,
      trustScore: entity.trustScore || 50,
      calculatedScore: score,
      factors,
      lastUpdated: entity.updatedAt,
    };
  }

  /**
   * Get top trusted entities by type
   */
  async getTopTrusted(entityType, limit = 10) {
    const { model } = this.getEntityModel(entityType);

    let query = {};
    let select = "trustScore";

    if (entityType === "NGO") {
      query = { role: "NGO", isActive: true };
      select += " name email";
    } else if (entityType === "CAMPAIGN") {
      query = { status: "ACTIVE" };
      select += " title description createdBy";
    } else if (entityType === "MERCHANT") {
      query = { status: "ACTIVE" };
      select += " shopName category";
    }

    const entities = await model
      .find(query)
      .select(select)
      .sort({ trustScore: -1 })
      .limit(limit)
      .lean();

    return entities;
  }

  /**
   * Recalculate trust scores for all entities of a type (admin function)
   */
  async recalculateAllTrustScores(entityType) {
    const { model } = this.getEntityModel(entityType);

    let query = {};
    if (entityType === "NGO") {
      query = { role: "NGO" };
    } else if (entityType === "CAMPAIGN") {
      query = { status: { $in: ["ACTIVE", "COMPLETED", "CLOSED"] } };
    } else if (entityType === "MERCHANT") {
      query = { status: { $in: ["ACTIVE", "SUSPENDED"] } };
    }

    const entities = await model.find(query).select("_id");

    const results = [];

    for (const entity of entities) {
      try {
        const result = await this.updateTrustScore(
          entity._id,
          entityType,
          "Bulk recalculation",
          "MANUAL_ADJUSTMENT",
          null,
        );
        results.push(result);
      } catch (error) {
        console.error(
          `[TrustService] Error recalculating trust for ${entity._id}:`,
          error,
        );
      }
    }

    return {
      entityType,
      total: entities.length,
      updated: results.length,
      results,
    };
  }

  /**
   * Get entity model based on entity type
   */
  getEntityModel(entityType) {
    switch (entityType) {
      case "NGO":
        return { model: User };
      case "CAMPAIGN":
        return { model: Campaign };
      case "MERCHANT":
        return { model: Merchant };
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}

export default new TrustService();
