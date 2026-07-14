import { AppError } from "../../utils/AppError.js";

/**
 * Campaign Data Parser
 * Provides consistent parsing and formatting of campaign data for frontend consumption
 * Ensures data integrity through round-trip validation
 */
class CampaignDataParser {
  /**
   * Parse and format campaign policy snapshots for display
   * @param {Object} policySnapshot - Raw policy snapshot from database
   * @returns {Object} - Formatted policy snapshot
   */
  formatPolicySnapshot(policySnapshot) {
    if (!policySnapshot || typeof policySnapshot !== "object") {
      throw new AppError("Invalid policy snapshot: must be an object", 400);
    }

    try {
      const formatted = {
        allowedCategories: this.formatAllowedCategories(
          policySnapshot.allowedCategories,
        ),
        maxPerBeneficiary: this.formatCurrency(
          policySnapshot.maxPerBeneficiary,
        ),
        maxPerTransaction: this.formatCurrency(
          policySnapshot.maxPerTransaction,
        ),
        validityDays: this.formatDays(policySnapshot.validityDays),
        cooldownDays: this.formatDays(policySnapshot.cooldownDays),
        minEligibilityConfidence: this.formatPercentage(
          policySnapshot.minEligibilityConfidence,
        ),
        maxFraudRisk: this.formatPercentage(policySnapshot.maxFraudRisk),
      };

      // Add display strings for UI
      formatted.displayText = {
        categories: formatted.allowedCategories.join(", "),
        beneficiaryCap: `₹${formatted.maxPerBeneficiary.toLocaleString("en-IN")} per beneficiary`,
        transactionCap: `₹${formatted.maxPerTransaction.toLocaleString("en-IN")} per transaction`,
        validity: `${formatted.validityDays} days validity`,
        cooldown: `${formatted.cooldownDays} days cooldown`,
        eligibilityThreshold: `${Math.round(formatted.minEligibilityConfidence * 100)}% min confidence`,
        fraudThreshold: `${Math.round(formatted.maxFraudRisk * 100)}% max risk`,
      };

      return formatted;
    } catch (error) {
      throw new AppError(
        `Policy snapshot formatting error: ${error.message}`,
        400,
      );
    }
  }

  /**
   * Format allowed categories array
   * @param {Array} categories - Array of category strings
   * @returns {Array} - Validated and formatted categories
   */
  formatAllowedCategories(categories) {
    if (!Array.isArray(categories)) {
      return ["FOOD", "MEDICINE", "SHELTER"]; // Default categories
    }

    const validCategories = ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"];
    const formatted = categories
      .filter(
        (cat) =>
          typeof cat === "string" &&
          validCategories.includes(cat.toUpperCase()),
      )
      .map((cat) => cat.toUpperCase());

    return formatted.length > 0 ? formatted : ["FOOD", "MEDICINE", "SHELTER"];
  }

  /**
   * Calculate and format funding progress percentage
   * @param {Number} totalDonated - Total amount donated
   * @param {Number} targetAmount - Target amount for the campaign
   * @returns {Object} - Funding progress information
   */
  calculateFundingProgress(totalDonated, targetAmount) {
    if (typeof totalDonated !== "number" || typeof targetAmount !== "number") {
      throw new AppError("Invalid funding amounts: must be numbers", 400);
    }

    if (targetAmount <= 0) {
      return {
        percentage: 0,
        remaining: 0,
        isComplete: false,
        displayText: "No target set",
      };
    }

    const donated = Math.max(0, totalDonated);
    const target = Math.max(1, targetAmount);
    const percentage = Math.round((donated / target) * 100);
    const remaining = Math.max(0, target - donated);
    const isComplete = donated >= target;

    return {
      percentage: Math.min(100, percentage),
      donated: donated,
      target: target,
      remaining: remaining,
      isComplete: isComplete,
      displayText: {
        percentage: `${percentage}%`,
        donated: `₹${donated.toLocaleString("en-IN")}`,
        target: `₹${target.toLocaleString("en-IN")}`,
        remaining: `₹${remaining.toLocaleString("en-IN")} remaining`,
        status: isComplete ? "Target Reached" : `${percentage}% funded`,
      },
    };
  }

  /**
   * Format location data into readable address strings
   * @param {Object} locationObject - Location object with ward, district, state
   * @returns {Object} - Formatted location information
   */
  formatLocation(locationObject) {
    if (!locationObject || typeof locationObject !== "object") {
      return {
        full: "Location not disclosed",
        short: "Undisclosed",
        components: {
          ward: null,
          district: null,
          state: null,
        },
        searchable: "",
      };
    }

    try {
      const components = {
        ward: this.sanitizeLocationComponent(locationObject.ward),
        district: this.sanitizeLocationComponent(locationObject.district),
        state: this.sanitizeLocationComponent(locationObject.state),
      };

      // Build address components array (non-null values only)
      const addressParts = [
        components.ward,
        components.district,
        components.state,
      ].filter((part) => part !== null && part.trim() !== "");

      const fullAddress =
        addressParts.length > 0
          ? addressParts.join(", ")
          : "Location not disclosed";

      const shortAddress =
        addressParts.length > 0
          ? addressParts.slice(-2).join(", ") // Last 2 components (district, state)
          : "Undisclosed";

      return {
        full: fullAddress,
        short: shortAddress,
        components: components,
        searchable: addressParts.join(" ").toLowerCase(),
        hasLocation: addressParts.length > 0,
      };
    } catch (error) {
      throw new AppError(`Location formatting error: ${error.message}`, 400);
    }
  }

  /**
   * Parse and validate campaign data structure
   * @param {Object} rawCampaign - Raw campaign data from database
   * @returns {Object} - Parsed and validated campaign data
   */
  parseCampaignData(rawCampaign) {
    if (!rawCampaign || typeof rawCampaign !== "object") {
      throw new AppError("Invalid campaign data: must be an object", 400);
    }

    try {
      const parsed = {
        // Basic information
        id: this.validateObjectId(rawCampaign._id || rawCampaign.id),
        title: this.sanitizeString(rawCampaign.title),
        description: this.sanitizeString(rawCampaign.description),
        disasterType: this.validateDisasterType(rawCampaign.disasterType),

        // Financial information
        targetAmount: this.validateAmount(rawCampaign.targetAmount),
        totalDonated: this.validateAmount(rawCampaign.totalDonated || 0),

        // Location and policy
        location: this.formatLocation(rawCampaign.location),
        policySnapshot: this.formatPolicySnapshot(rawCampaign.policySnapshot),

        // Metrics and scores
        trustScore: this.validateScore(rawCampaign.trustScore),
        transparencyScore: this.validateScore(
          rawCampaign.transparencyScore || 0,
        ),

        // Timestamps
        createdAt: this.validateDate(rawCampaign.createdAt),
        endDate: rawCampaign.endDate
          ? this.validateDate(rawCampaign.endDate)
          : null,

        // Status and metadata
        status: this.validateStatus(rawCampaign.status),
        ngoName: this.sanitizeString(rawCampaign.ngoName || "Unknown NGO"),
        ngoVerificationStatus: rawCampaign.ngoVerificationStatus || "PENDING",
      };

      // Calculate derived fields
      parsed.fundingProgress = this.calculateFundingProgress(
        parsed.totalDonated,
        parsed.targetAmount,
      );

      // Add display helpers
      parsed.displayText = {
        title: parsed.title,
        shortDescription: this.truncateText(parsed.description, 150),
        location: parsed.location.short,
        disasterType: this.formatDisasterType(parsed.disasterType),
        trustScore: parsed.trustScore ? `${parsed.trustScore}/100` : "Pending",
        createdAt: this.formatDate(parsed.createdAt),
        endDate: parsed.endDate ? this.formatDate(parsed.endDate) : null,
      };

      return parsed;
    } catch (error) {
      throw new AppError(`Campaign data parsing error: ${error.message}`, 400);
    }
  }

  /**
   * Format campaign data for display (reverse of parsing)
   * @param {Object} parsedCampaign - Parsed campaign data
   * @returns {Object} - Campaign data formatted for display
   */
  formatForDisplay(parsedCampaign) {
    if (!parsedCampaign || typeof parsedCampaign !== "object") {
      throw new AppError("Invalid parsed campaign data", 400);
    }

    try {
      return {
        _id: parsedCampaign.id,
        title: parsedCampaign.title,
        description: parsedCampaign.description,
        disasterType: parsedCampaign.disasterType,
        targetAmount: parsedCampaign.targetAmount,
        totalDonated: parsedCampaign.totalDonated,
        location: parsedCampaign.location.components,
        policySnapshot: {
          allowedCategories: parsedCampaign.policySnapshot.allowedCategories,
          maxPerBeneficiary: parsedCampaign.policySnapshot.maxPerBeneficiary,
          maxPerTransaction: parsedCampaign.policySnapshot.maxPerTransaction,
          validityDays: parsedCampaign.policySnapshot.validityDays,
          cooldownDays: parsedCampaign.policySnapshot.cooldownDays,
          minEligibilityConfidence:
            parsedCampaign.policySnapshot.minEligibilityConfidence,
          maxFraudRisk: parsedCampaign.policySnapshot.maxFraudRisk,
        },
        trustScore: parsedCampaign.trustScore,
        transparencyScore: parsedCampaign.transparencyScore,
        createdAt: parsedCampaign.createdAt,
        endDate: parsedCampaign.endDate,
        status: parsedCampaign.status,
        ngoName: parsedCampaign.ngoName,
        ngoVerificationStatus: parsedCampaign.ngoVerificationStatus,
      };
    } catch (error) {
      throw new AppError(`Display formatting error: ${error.message}`, 400);
    }
  }

  // Helper validation methods

  validateObjectId(id) {
    if (!id) throw new AppError("Missing campaign ID", 400);
    return id.toString();
  }

  sanitizeString(str) {
    if (typeof str !== "string") return "";
    return str.trim().substring(0, 1000); // Limit length for security
  }

  validateDisasterType(type) {
    const validTypes = [
      "FLOOD",
      "EARTHQUAKE",
      "CYCLONE",
      "FIRE",
      "DROUGHT",
      "PANDEMIC",
      "WAR",
      "OTHER",
    ];
    if (!type || !validTypes.includes(type.toUpperCase())) {
      return "OTHER";
    }
    return type.toUpperCase();
  }

  validateAmount(amount) {
    const num = Number(amount);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num);
  }

  validateScore(score) {
    if (score === null || score === undefined) return null;
    const num = Number(score);
    if (isNaN(num)) return null;
    return Math.max(0, Math.min(100, Math.round(num)));
  }

  validateDate(date) {
    if (!date) throw new AppError("Invalid date", 400);
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) throw new AppError("Invalid date format", 400);
    return parsed;
  }

  validateStatus(status) {
    const validStatuses = [
      "DRAFT",
      "PENDING_APPROVAL",
      "ACTIVE",
      "PAUSED",
      "COMPLETED",
      "CLOSED",
      "REJECTED",
    ];
    if (!status || !validStatuses.includes(status)) {
      return "DRAFT";
    }
    return status;
  }

  sanitizeLocationComponent(component) {
    if (!component || typeof component !== "string") return null;
    const sanitized = component.trim();
    return sanitized.length > 0 ? sanitized : null;
  }

  formatCurrency(amount) {
    const num = Number(amount);
    return isNaN(num) ? 0 : Math.max(0, Math.round(num));
  }

  formatDays(days) {
    const num = Number(days);
    return isNaN(num) ? 0 : Math.max(0, Math.round(num));
  }

  formatPercentage(percentage) {
    const num = Number(percentage);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(1, num));
  }

  truncateText(text, maxLength) {
    if (!text || typeof text !== "string") return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  formatDisasterType(type) {
    const typeMap = {
      FLOOD: "Flood Relief",
      EARTHQUAKE: "Earthquake Recovery",
      CYCLONE: "Cyclone Response",
      FIRE: "Fire Emergency",
      DROUGHT: "Drought Relief",
      PANDEMIC: "Pandemic Response",
      WAR: "Conflict Relief",
      OTHER: "Emergency Relief",
    };
    return typeMap[type] || "Emergency Relief";
  }

  formatDate(date) {
    if (!date) return null;
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate round-trip data integrity
   * Parse -> Format -> Parse should produce equivalent data
   * @param {Object} originalData - Original campaign data
   * @returns {Boolean} - True if round-trip is successful
   */
  validateRoundTrip(originalData) {
    try {
      const parsed1 = this.parseCampaignData(originalData);
      const formatted = this.formatForDisplay(parsed1);
      const parsed2 = this.parseCampaignData(formatted);

      // Check essential fields for equivalence
      const essentialFields = [
        "title",
        "targetAmount",
        "totalDonated",
        "disasterType",
        "status",
      ];

      for (const field of essentialFields) {
        if (parsed1[field] !== parsed2[field]) {
          console.warn(`Round-trip validation failed for field: ${field}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Round-trip validation error:", error);
      return false;
    }
  }
}

export default new CampaignDataParser();
