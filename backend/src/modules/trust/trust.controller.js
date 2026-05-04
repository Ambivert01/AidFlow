import trustService from "./trust.service.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";

class TrustController {
  /**
   * Get NGO trust score
   * GET /api/trust/ngo/:id
   */
  getNGOTrust = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await trustService.getTrustScoreDetailed(id, "NGO");

    return res.json(
      ApiResponse.success(result, "NGO trust score retrieved successfully"),
    );
  });

  /**
   * Get Campaign trust score
   * GET /api/trust/campaign/:id
   */
  getCampaignTrust = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await trustService.getTrustScoreDetailed(id, "CAMPAIGN");

    return res.json(
      ApiResponse.success(
        result,
        "Campaign trust score retrieved successfully",
      ),
    );
  });

  /**
   * Get Merchant trust score
   * GET /api/trust/merchant/:id
   */
  getMerchantTrust = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await trustService.getTrustScoreDetailed(id, "MERCHANT");

    return res.json(
      ApiResponse.success(
        result,
        "Merchant trust score retrieved successfully",
      ),
    );
  });

  /**
   * Get trust score history
   * GET /api/trust/history/:entityType/:id
   */
  getTrustHistory = asyncHandler(async (req, res) => {
    const { entityType, id } = req.params;
    const { limit } = req.query;

    const history = await trustService.getTrustHistory(
      id,
      entityType.toUpperCase(),
      limit ? parseInt(limit) : 50,
    );

    return res.json(
      ApiResponse.success(history, "Trust history retrieved successfully"),
    );
  });

  /**
   * Get top trusted entities
   * GET /api/trust/top/:entityType
   */
  getTopTrusted = asyncHandler(async (req, res) => {
    const { entityType } = req.params;
    const { limit } = req.query;

    const entities = await trustService.getTopTrusted(
      entityType.toUpperCase(),
      limit ? parseInt(limit) : 10,
    );

    return res.json(
      ApiResponse.success(
        entities,
        "Top trusted entities retrieved successfully",
      ),
    );
  });

  /**
   * Manually trigger trust score update
   * POST /api/trust/update/:entityType/:id
   * Admin only
   */
  updateTrustScore = asyncHandler(async (req, res) => {
    const { entityType, id } = req.params;
    const { reason } = req.body;

    const result = await trustService.updateTrustScore(
      id,
      entityType.toUpperCase(),
      reason || "Manual update",
      "MANUAL_ADJUSTMENT",
      req.user.id,
    );

    return res.json(
      ApiResponse.success(result, "Trust score updated successfully"),
    );
  });

  /**
   * Recalculate all trust scores for an entity type
   * POST /api/trust/recalculate/:entityType
   * Admin only
   */
  recalculateAll = asyncHandler(async (req, res) => {
    const { entityType } = req.params;

    const result = await trustService.recalculateAllTrustScores(
      entityType.toUpperCase(),
    );

    return res.json(
      ApiResponse.success(result, "Trust scores recalculated successfully"),
    );
  });
}

export default new TrustController();
