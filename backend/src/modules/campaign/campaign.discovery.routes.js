import express from "express";
import campaignDiscoveryService from "./campaign.discovery.service.js";
import campaignRecommendationService from "./campaign.recommendation.service.js";
import campaignValidationService from "./campaign.validation.service.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";

const router = express.Router();

/**
 * @route GET /api/campaign/discover
 * @desc Discover campaigns with advanced filtering and sorting
 * @access Public
 * @query {String} disasterType - Filter by disaster type (FLOOD, EARTHQUAKE, etc.)
 * @query {String} location - Filter by location (text search)
 * @query {Number} trustScoreMin - Minimum trust score (0-100)
 * @query {Number} trustScoreMax - Maximum trust score (0-100)
 * @query {Number} fundingProgressMin - Minimum funding progress percentage (0-100)
 * @query {Number} fundingProgressMax - Maximum funding progress percentage (0-100)
 * @query {String[]} ngoVerificationStatus - NGO verification status filter
 * @query {String} sort - Sort criteria (trust_desc/highest_trust, funded_desc/most_funded, recent/most_recent, ending_soon, funding_progress_desc, transparency_desc, recommended)
 * @query {Number} page - Page number (default: 1)
 * @query {Number} limit - Items per page (default: 12, max: 50)
 */
router.get(
  "/discover",
  asyncHandler(async (req, res) => {
    try {
      // Use validation service for comprehensive parameter validation
      const validationResult =
        campaignValidationService.validateDiscoveryRequest({
          filters: {
            disasterType: req.query.disasterType,
            location: req.query.location,
            trustScoreMin: req.query.trustScoreMin,
            trustScoreMax: req.query.trustScoreMax,
            fundingProgressMin: req.query.fundingProgressMin,
            fundingProgressMax: req.query.fundingProgressMax,
            targetAmountMin: req.query.targetAmountMin,
            targetAmountMax: req.query.targetAmountMax,
            ngoVerificationStatus: req.query.ngoVerificationStatus,
            maxAge: req.query.maxAge,
            endingWithinDays: req.query.endingWithinDays,
            minTransparencyScore: req.query.minTransparencyScore,
            minProofCount: req.query.minProofCount,
            search: req.query.search,
          },
          sort: req.query.sort || "recent",
          pagination: {
            page: req.query.page || 1,
            limit: req.query.limit || 12,
          },
        });

      const result = await campaignDiscoveryService.discoverCampaigns(
        validationResult.filters || {},
        validationResult.sort || "recent",
        validationResult.pagination || { page: 1, limit: 12 },
      );

      res.json(result);
    } catch (error) {
      // Enhanced error handling with detailed validation messages
      if (error instanceof AppError && error.code === "VALIDATION_ERROR") {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details || {},
        });
      }

      // Re-throw other errors to be handled by global error handler
      throw error;
    }
  }),
);

/**
 * @route GET /api/campaign/recommend/:donorId
 * @desc Get personalized campaign recommendations for a donor
 * @access Private (Donor only)
 * @param {String} donorId - Donor user ID
 * @query {Number} minTrustScore - Minimum trust score for recommendations
 * @query {String} disasterType - Preferred disaster type
 * @query {String} location - Preferred location
 * @query {Number} limit - Number of recommendations (default: 6, max: 12)
 * @query {Boolean} includeReasoning - Include recommendation reasoning (default: true)
 * @query {String[]} excludeCampaignIds - Campaign IDs to exclude from recommendations
 */
router.get(
  "/recommend/:donorId",
  asyncHandler(async (req, res) => {
    try {
      const { donorId } = req.params;
      const {
        minTrustScore,
        disasterType,
        location,
        limit = 6,
        includeReasoning = true,
        excludeCampaignIds,
      } = req.query;

      // Validate donor ID
      const donorValidation =
        campaignValidationService.validateDonorId(donorId);
      if (!donorValidation.isValid) {
        throw new AppError(donorValidation.error, 400, "VALIDATION_ERROR");
      }

      // Validate limit
      const limitValidation = campaignValidationService.validateNumericField(
        limit,
        "limit",
        "Recommendation limit",
      );
      if (!limitValidation.isValid) {
        throw new AppError(limitValidation.error, 400, "VALIDATION_ERROR");
      }

      // Build preferences object with validation
      const preferences = {
        limit: Math.min(12, limitValidation.value), // Cap at 12 for recommendations
        includeReasoning: includeReasoning !== "false",
      };

      if (minTrustScore) {
        const trustValidation = campaignValidationService.validateNumericField(
          minTrustScore,
          "trustScore",
          "Minimum trust score",
        );
        if (trustValidation.isValid) {
          preferences.minTrustScore = trustValidation.value;
        }
      }

      if (disasterType) {
        const typeValidation =
          campaignValidationService.validateDisasterType(disasterType);
        if (typeValidation.isValid) {
          preferences.disasterType = typeValidation.value;
        }
      }

      if (location) {
        const locationValidation =
          campaignValidationService.validateLocation(location);
        if (locationValidation.isValid) {
          preferences.location = locationValidation.value;
        }
      }

      if (excludeCampaignIds) {
        preferences.excludeCampaignIds = Array.isArray(excludeCampaignIds)
          ? excludeCampaignIds
          : [excludeCampaignIds];
      }

      const result = await campaignDiscoveryService.getRecommendations(
        donorValidation.value,
        preferences,
      );

      res.json(result);
    } catch (error) {
      // Enhanced error handling for recommendations
      if (error instanceof AppError && error.code === "VALIDATION_ERROR") {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
        });
      }

      throw error;
    }
  }),
);

/**
 * @route GET /api/campaign/donor-profile/:donorId
 * @desc Get donor profile and preferences for personalization
 * @access Private (Donor only)
 * @param {String} donorId - Donor user ID
 */
router.get(
  "/donor-profile/:donorId",
  asyncHandler(async (req, res) => {
    const { donorId } = req.params;

    try {
      const donorProfile =
        await campaignRecommendationService.buildDonorProfile(donorId);

      res.json({
        success: true,
        data: {
          profile: donorProfile,
          insights: {
            isNewDonor: donorProfile.totalDonations === 0,
            donationLevel: donorProfile.generosityLevel,
            riskPreference: donorProfile.riskTolerance,
            loyaltyLevel: donorProfile.loyaltyScore > 50 ? "high" : "medium",
            recommendedMinTrust: Math.max(
              50,
              donorProfile.trustScorePreference - 10,
            ),
          },
        },
      });
    } catch (error) {
      throw new AppError("Failed to get donor profile", 500);
    }
  }),
);

/**
 * @route POST /api/campaign/invalidate-cache
 * @desc Invalidate campaign discovery cache (for admin use)
 * @access Private (Admin only)
 * @body {String} campaignId - Optional specific campaign ID to invalidate
 */
router.post(
  "/invalidate-cache",
  asyncHandler(async (req, res) => {
    const { campaignId } = req.body;

    await campaignDiscoveryService.invalidateCache(campaignId);

    res.json({
      success: true,
      message: campaignId
        ? `Cache invalidated for campaign ${campaignId}`
        : "All campaign discovery cache invalidated",
    });
  }),
);

/**
 * @route GET /api/campaign/discover/stats
 * @desc Get campaign discovery statistics
 * @access Public
 */
router.get(
  "/discover/stats",
  asyncHandler(async (req, res) => {
    try {
      // Get basic campaign statistics for discovery interface
      const stats = await campaignDiscoveryService.getDiscoveryStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw new AppError("Failed to get discovery statistics", 500);
    }
  }),
);

/**
 * @route GET /api/campaign/discover/performance
 * @desc Get campaign discovery performance metrics
 * @access Public (for monitoring)
 */
router.get(
  "/discover/performance",
  asyncHandler(async (req, res) => {
    try {
      const performanceMetrics =
        campaignDiscoveryService.getPerformanceMetrics();
      res.json({
        success: true,
        data: performanceMetrics,
      });
    } catch (error) {
      throw new AppError("Failed to get performance metrics", 500);
    }
  }),
);

export default router;
