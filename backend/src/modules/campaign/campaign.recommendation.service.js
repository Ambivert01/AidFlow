import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { User } from "../../models/auth/User.model.js";
import { AppError } from "../../utils/AppError.js";
import { BaseService } from "../../core/base.service.js";
import { CAMPAIGN_STATUS } from "./campaign.constants.js";
import campaignDiscoveryService from "./campaign.discovery.service.js";
import { redisConnection } from "../../config/redis.config.js";

/**
 * Campaign Recommendation Engine
 * Provides personalized campaign recommendations based on donor behavior,
 * preferences, and historical donation patterns
 */
class CampaignRecommendationService {
  constructor() {
    this.redis = redisConnection;
    this.RECOMMENDATION_CACHE_TTL = 30 * 60; // 30 minutes for recommendations
  }

  /**
   * Get personalized campaign recommendations for a donor
   * @param {String} donorId - Donor user ID
   * @param {Object} options - Recommendation options
   * @returns {Object} - Recommended campaigns with reasoning
   */
  async getPersonalizedRecommendations(donorId, options = {}) {
    try {
      const {
        limit = 6,
        includeReasoning = true,
        minTrustScore = 50,
        excludeCampaignIds = [],
      } = options;

      // Generate cache key
      const cacheKey = `recommendations:${donorId}:${JSON.stringify(options)}`;

      // Try cache first
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return BaseService.success(JSON.parse(cached));
        }
      } catch (cacheError) {
        console.warn("Recommendation cache unavailable:", cacheError);
      }

      // Get donor profile and preferences
      const donorProfile = await this.buildDonorProfile(donorId);

      // Get base recommendations using different strategies
      const [
        similarityRecommendations,
        categoryRecommendations,
        locationRecommendations,
        trendingRecommendations,
      ] = await Promise.all([
        this.getSimilarityBasedRecommendations(donorProfile, limit),
        this.getCategoryBasedRecommendations(donorProfile, limit),
        this.getLocationBasedRecommendations(donorProfile, limit),
        this.getTrendingRecommendations(limit),
      ]);

      // Combine and score recommendations
      const combinedRecommendations = this.combineRecommendations([
        {
          recommendations: similarityRecommendations,
          weight: 0.4,
          type: "similarity",
        },
        {
          recommendations: categoryRecommendations,
          weight: 0.3,
          type: "category",
        },
        {
          recommendations: locationRecommendations,
          weight: 0.2,
          type: "location",
        },
        {
          recommendations: trendingRecommendations,
          weight: 0.1,
          type: "trending",
        },
      ]);

      // Filter and enhance recommendations
      let finalRecommendations = combinedRecommendations
        .filter(
          (rec) =>
            !excludeCampaignIds.includes(rec.campaignId) &&
            (rec.trustScore || 0) >= minTrustScore,
        )
        .slice(0, limit);

      // Enhance with full campaign data
      finalRecommendations = await this.enhanceRecommendations(
        finalRecommendations,
        includeReasoning,
      );

      const result = {
        recommendations: finalRecommendations,
        donorProfile: {
          totalDonations: donorProfile.totalDonations,
          averageDonation: donorProfile.averageDonation,
          preferredCategories: donorProfile.preferredCategories,
          preferredLocations: donorProfile.preferredLocations,
          trustScorePreference: donorProfile.trustScorePreference,
        },
        generatedAt: new Date(),
      };

      // Cache the result
      try {
        await this.redis.setex(
          cacheKey,
          this.RECOMMENDATION_CACHE_TTL,
          JSON.stringify(result),
        );
      } catch (cacheError) {
        console.warn("Failed to cache recommendations:", cacheError);
      }

      return BaseService.success(result);
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error getting personalized recommendations:",
        error,
      );
      throw error;
    }
  }

  /**
   * Build comprehensive donor profile from historical data
   * @param {String} donorId - Donor user ID
   * @returns {Object} - Donor profile with preferences and patterns
   */
  async buildDonorProfile(donorId) {
    try {
      // Get donor's donation history
      const donations = await Donation.find({
        donor: donorId,
        paymentStatus: "SUCCESS",
      })
        .populate("campaign", "disasterType location targetAmount trustScore")
        .sort({ createdAt: -1 })
        .limit(50); // Last 50 donations for analysis

      if (donations.length === 0) {
        // New donor - return default profile
        return this.getDefaultDonorProfile();
      }

      // Analyze donation patterns
      const totalDonations = donations.length;
      const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
      const averageDonation = totalAmount / totalDonations;

      // Analyze preferred disaster categories
      const categoryFrequency = {};
      donations.forEach((donation) => {
        if (donation.campaign?.disasterType) {
          categoryFrequency[donation.campaign.disasterType] =
            (categoryFrequency[donation.campaign.disasterType] || 0) + 1;
        }
      });

      const preferredCategories = Object.entries(categoryFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Analyze preferred locations
      const locationFrequency = {};
      donations.forEach((donation) => {
        if (donation.campaign?.location?.state) {
          const state = donation.campaign.location.state;
          locationFrequency[state] = (locationFrequency[state] || 0) + 1;
        }
      });

      const preferredLocations = Object.entries(locationFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([location]) => location);

      // Analyze trust score preferences
      const trustScores = donations
        .map((d) => d.campaign?.trustScore)
        .filter((score) => score !== null && score !== undefined);

      const averageTrustScore =
        trustScores.length > 0
          ? trustScores.reduce((sum, score) => sum + score, 0) /
            trustScores.length
          : 70; // Default preference

      // Analyze donation timing patterns
      const donationTimes = donations.map((d) => d.createdAt);
      const daysSinceLastDonation =
        donationTimes.length > 0
          ? Math.floor(
              (Date.now() - donationTimes[0].getTime()) / (1000 * 60 * 60 * 24),
            )
          : null;

      // Analyze donation amount patterns
      const donationAmounts = donations
        .map((d) => d.amount)
        .sort((a, b) => a - b);
      const medianDonation =
        donationAmounts.length > 0
          ? donationAmounts[Math.floor(donationAmounts.length / 2)]
          : averageDonation;

      return {
        donorId,
        totalDonations,
        totalAmount,
        averageDonation,
        medianDonation,
        preferredCategories,
        preferredLocations,
        trustScorePreference: Math.round(averageTrustScore),
        daysSinceLastDonation,
        donationFrequency: this.calculateDonationFrequency(donationTimes),
        riskTolerance: this.calculateRiskTolerance(trustScores),
        generosityLevel: this.calculateGenerosityLevel(averageDonation),
        loyaltyScore: this.calculateLoyaltyScore(donations),
      };
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error building donor profile:",
        error,
      );
      return this.getDefaultDonorProfile();
    }
  }

  /**
   * Get default profile for new donors
   * @returns {Object} - Default donor profile
   */
  getDefaultDonorProfile() {
    return {
      donorId: null,
      totalDonations: 0,
      totalAmount: 0,
      averageDonation: 0,
      medianDonation: 0,
      preferredCategories: ["FLOOD", "EARTHQUAKE", "FAMINE"], // Most common disasters
      preferredLocations: [],
      trustScorePreference: 70, // Conservative default
      daysSinceLastDonation: null,
      donationFrequency: "new",
      riskTolerance: "medium",
      generosityLevel: "medium",
      loyaltyScore: 0,
    };
  }

  /**
   * Get similarity-based recommendations using collaborative filtering
   * @param {Object} donorProfile - Donor profile
   * @param {Number} limit - Number of recommendations
   * @returns {Array} - Similar donor recommendations
   */
  async getSimilarityBasedRecommendations(donorProfile, limit) {
    try {
      if (donorProfile.totalDonations === 0) {
        return [];
      }

      // Find similar donors based on donation patterns
      const similarDonors = await this.findSimilarDonors(donorProfile);

      if (similarDonors.length === 0) {
        return [];
      }

      // Get campaigns donated to by similar donors
      const similarDonorIds = similarDonors.map((d) => d.donorId);
      const similarDonations = await Donation.find({
        donor: { $in: similarDonorIds },
        paymentStatus: "SUCCESS",
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      }).populate("campaign");

      // Score campaigns by similarity
      const campaignScores = {};
      similarDonations.forEach((donation) => {
        if (
          donation.campaign &&
          donation.campaign.status === CAMPAIGN_STATUS.ACTIVE
        ) {
          const campaignId = donation.campaign._id.toString();
          campaignScores[campaignId] = (campaignScores[campaignId] || 0) + 1;
        }
      });

      return Object.entries(campaignScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([campaignId, score]) => ({
          campaignId,
          score: score / similarDonors.length, // Normalize by number of similar donors
          reasoning: `Recommended by ${score} similar donors`,
        }));
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error in similarity recommendations:",
        error,
      );
      return [];
    }
  }

  /**
   * Get category-based recommendations based on donor preferences
   * @param {Object} donorProfile - Donor profile
   * @param {Number} limit - Number of recommendations
   * @returns {Array} - Category-based recommendations
   */
  async getCategoryBasedRecommendations(donorProfile, limit) {
    try {
      const filters = {};

      // Use preferred categories if available
      if (donorProfile.preferredCategories.length > 0) {
        filters.disasterType = donorProfile.preferredCategories;
      }

      // Use trust score preference
      if (donorProfile.trustScorePreference > 0) {
        filters.trustScoreMin = Math.max(
          50,
          donorProfile.trustScorePreference - 20,
        );
      }

      const result = await campaignDiscoveryService.discoverCampaigns(
        filters,
        "trust_desc",
        { page: 1, limit },
      );

      return result.data.campaigns.map((campaign) => ({
        campaignId: campaign._id.toString(),
        score: this.calculateCategoryScore(campaign, donorProfile),
        reasoning: `Matches your preferred categories: ${donorProfile.preferredCategories.join(", ")}`,
      }));
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error in category recommendations:",
        error,
      );
      return [];
    }
  }

  /**
   * Get location-based recommendations
   * @param {Object} donorProfile - Donor profile
   * @param {Number} limit - Number of recommendations
   * @returns {Array} - Location-based recommendations
   */
  async getLocationBasedRecommendations(donorProfile, limit) {
    try {
      if (donorProfile.preferredLocations.length === 0) {
        return [];
      }

      const locationRecommendations = [];

      for (const location of donorProfile.preferredLocations.slice(0, 2)) {
        const result = await campaignDiscoveryService.discoverCampaigns(
          { location },
          "trust_desc",
          { page: 1, limit: Math.ceil(limit / 2) },
        );

        result.data.campaigns.forEach((campaign) => {
          locationRecommendations.push({
            campaignId: campaign._id.toString(),
            score: this.calculateLocationScore(campaign, donorProfile),
            reasoning: `Located in ${location}, where you've donated before`,
          });
        });
      }

      return locationRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error in location recommendations:",
        error,
      );
      return [];
    }
  }

  /**
   * Get trending recommendations based on recent activity
   * @param {Number} limit - Number of recommendations
   * @returns {Array} - Trending recommendations
   */
  async getTrendingRecommendations(limit) {
    try {
      // Get campaigns with recent donation activity
      const result = await campaignDiscoveryService.discoverCampaigns(
        { trustScoreMin: 60 },
        "funded_desc",
        { page: 1, limit },
      );

      return result.data.campaigns.map((campaign) => ({
        campaignId: campaign._id.toString(),
        score: 0.5, // Base trending score
        reasoning: "Currently trending with high donation activity",
      }));
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error in trending recommendations:",
        error,
      );
      return [];
    }
  }

  /**
   * Combine recommendations from different strategies
   * @param {Array} recommendationSets - Array of recommendation sets with weights
   * @returns {Array} - Combined and scored recommendations
   */
  combineRecommendations(recommendationSets) {
    const campaignScores = {};

    recommendationSets.forEach(({ recommendations, weight, type }) => {
      recommendations.forEach((rec) => {
        if (!campaignScores[rec.campaignId]) {
          campaignScores[rec.campaignId] = {
            campaignId: rec.campaignId,
            totalScore: 0,
            sources: [],
          };
        }

        campaignScores[rec.campaignId].totalScore += rec.score * weight;
        campaignScores[rec.campaignId].sources.push({
          type,
          score: rec.score,
          reasoning: rec.reasoning,
        });
      });
    });

    return Object.values(campaignScores).sort(
      (a, b) => b.totalScore - a.totalScore,
    );
  }

  /**
   * Enhance recommendations with full campaign data
   * @param {Array} recommendations - Basic recommendations
   * @param {Boolean} includeReasoning - Whether to include reasoning
   * @returns {Array} - Enhanced recommendations
   */
  async enhanceRecommendations(recommendations, includeReasoning = true) {
    try {
      const campaignIds = recommendations.map((rec) => rec.campaignId);

      const campaigns = await Campaign.find({
        _id: { $in: campaignIds },
        status: CAMPAIGN_STATUS.ACTIVE,
      }).populate("createdBy", "name verificationStatus");

      const campaignMap = {};
      campaigns.forEach((campaign) => {
        campaignMap[campaign._id.toString()] = campaign;
      });

      return recommendations
        .filter((rec) => campaignMap[rec.campaignId])
        .map((rec) => {
          const campaign = campaignMap[rec.campaignId];
          const enhanced = {
            campaign: {
              _id: campaign._id,
              title: campaign.title,
              description: campaign.description,
              disasterType: campaign.disasterType,
              targetAmount: campaign.targetAmount,
              totalDonated: campaign.totalDonated,
              location: campaign.location,
              trustScore: campaign.trustScore,
              transparencyScore: campaign.transparencyScore,
              createdAt: campaign.createdAt,
              endDate: campaign.endDate,
              ngo: {
                name: campaign.createdBy.name,
                verificationStatus: campaign.createdBy.verificationStatus,
              },
            },
            recommendationScore: rec.totalScore,
          };

          if (includeReasoning) {
            enhanced.reasoning = rec.sources;
          }

          return enhanced;
        });
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error enhancing recommendations:",
        error,
      );
      return [];
    }
  }

  // Helper methods for profile analysis
  calculateDonationFrequency(donationTimes) {
    if (donationTimes.length < 2) return "new";

    const intervals = [];
    for (let i = 1; i < donationTimes.length; i++) {
      intervals.push(donationTimes[i - 1] - donationTimes[i]);
    }

    const avgInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const avgDays = avgInterval / (1000 * 60 * 60 * 24);

    if (avgDays <= 7) return "weekly";
    if (avgDays <= 30) return "monthly";
    if (avgDays <= 90) return "quarterly";
    return "occasional";
  }

  calculateRiskTolerance(trustScores) {
    if (trustScores.length === 0) return "medium";

    const avgTrust =
      trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length;

    if (avgTrust >= 80) return "low"; // Prefers high-trust campaigns
    if (avgTrust >= 60) return "medium";
    return "high"; // Willing to donate to lower-trust campaigns
  }

  calculateGenerosityLevel(averageDonation) {
    if (averageDonation >= 10000) return "high";
    if (averageDonation >= 2000) return "medium";
    return "low";
  }

  calculateLoyaltyScore(donations) {
    // Calculate how often donor returns to same campaigns/NGOs
    const ngoFrequency = {};
    donations.forEach((donation) => {
      if (donation.campaign?.createdBy) {
        const ngoId = donation.campaign.createdBy.toString();
        ngoFrequency[ngoId] = (ngoFrequency[ngoId] || 0) + 1;
      }
    });

    const repeatDonations = Object.values(ngoFrequency).filter(
      (count) => count > 1,
    ).length;
    return Math.min(100, (repeatDonations / donations.length) * 100);
  }

  calculateCategoryScore(campaign, donorProfile) {
    let score = 0.5; // Base score

    if (donorProfile.preferredCategories.includes(campaign.disasterType)) {
      score += 0.3;
    }

    if (campaign.trustScore >= donorProfile.trustScorePreference) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  calculateLocationScore(campaign, donorProfile) {
    let score = 0.5; // Base score

    if (
      campaign.location?.state &&
      donorProfile.preferredLocations.includes(campaign.location.state)
    ) {
      score += 0.4;
    }

    if (campaign.trustScore >= donorProfile.trustScorePreference) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Find donors with similar donation patterns
   * @param {Object} donorProfile - Target donor profile
   * @returns {Array} - Similar donor profiles
   */
  async findSimilarDonors(donorProfile) {
    try {
      // This is a simplified similarity calculation
      // In production, you might use more sophisticated ML algorithms

      const similarDonors = await Donation.aggregate([
        {
          $match: {
            paymentStatus: "SUCCESS",
            donor: { $ne: donorProfile.donorId },
          },
        },
        {
          $group: {
            _id: "$donor",
            totalDonations: { $sum: 1 },
            averageDonation: { $avg: "$amount" },
            categories: { $addToSet: "$campaign.disasterType" },
          },
        },
        {
          $match: {
            totalDonations: {
              $gte: Math.max(1, donorProfile.totalDonations - 5),
              $lte: donorProfile.totalDonations + 5,
            },
            averageDonation: {
              $gte: donorProfile.averageDonation * 0.5,
              $lte: donorProfile.averageDonation * 2,
            },
          },
        },
        { $limit: 10 },
      ]);

      return similarDonors.map((donor) => ({
        donorId: donor._id,
        similarity: this.calculateSimilarityScore(donor, donorProfile),
      }));
    } catch (error) {
      console.error(
        "[CampaignRecommendationService] Error finding similar donors:",
        error,
      );
      return [];
    }
  }

  calculateSimilarityScore(donor1, donor2) {
    // Simple similarity calculation based on donation patterns
    let score = 0;

    // Amount similarity (0-0.4)
    const amountRatio =
      Math.min(donor1.averageDonation, donor2.averageDonation) /
      Math.max(donor1.averageDonation, donor2.averageDonation);
    score += amountRatio * 0.4;

    // Frequency similarity (0-0.3)
    const freqRatio =
      Math.min(donor1.totalDonations, donor2.totalDonations) /
      Math.max(donor1.totalDonations, donor2.totalDonations);
    score += freqRatio * 0.3;

    // Category overlap (0-0.3)
    const commonCategories =
      donor1.categories?.filter((cat) =>
        donor2.preferredCategories?.includes(cat),
      ).length || 0;
    const totalCategories = new Set([
      ...(donor1.categories || []),
      ...(donor2.preferredCategories || []),
    ]).size;

    if (totalCategories > 0) {
      score += (commonCategories / totalCategories) * 0.3;
    }

    return score;
  }

  /**
   * Invalidate recommendation cache for a donor
   * @param {String} donorId - Donor user ID
   */
  async invalidateRecommendationCache(donorId) {
    try {
      const keys = await this.redis.keys(`recommendations:${donorId}:*`);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      console.warn("Failed to invalidate recommendation cache:", error);
    }
  }
}

export default new CampaignRecommendationService();
