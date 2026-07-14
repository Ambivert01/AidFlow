import { AppError } from "../../utils/AppError.js";

/**
 * Campaign Discovery Validation Service
 * Provides comprehensive validation for campaign discovery parameters
 * with detailed error messages and sanitization
 */
class CampaignValidationService {
  constructor() {
    this.VALID_DISASTER_TYPES = [
      "FLOOD",
      "EARTHQUAKE",
      "FAMINE",
      "WAR",
      "DROUGHT",
      "PANDEMIC",
      "CYCLONE",
      "FIRE",
      "OTHER",
    ];

    this.VALID_VERIFICATION_STATUSES = ["APPROVED", "PENDING", "REJECTED"];

    this.VALID_SORT_OPTIONS = [
      "trust_desc",
      "highest_trust",
      "funded_desc",
      "most_funded",
      "recent",
      "most_recent",
      "ending_soon",
      "funding_progress_desc",
      "transparency_desc",
      "recommended",
    ];

    this.VALIDATION_RULES = {
      trustScore: { min: 0, max: 100 },
      fundingProgress: { min: 0, max: 100 },
      transparencyScore: { min: 0, max: 100 },
      targetAmount: { min: 0, max: 10000000000 }, // 10 billion max
      maxAge: { min: 1, max: 3650 }, // 1 day to 10 years
      endingWithinDays: { min: 1, max: 365 }, // 1 day to 1 year
      proofCount: { min: 0, max: 10000 },
      page: { min: 1, max: 1000 },
      limit: { min: 1, max: 50 },
      searchLength: { min: 2, max: 100 },
      locationLength: { min: 2, max: 100 },
    };
  }

  /**
   * Validate complete discovery request parameters
   * @param {Object} params - Request parameters
   * @returns {Object} - Validated and sanitized parameters
   * @throws {AppError} - Validation error with detailed message
   */
  validateDiscoveryRequest(params) {
    const errors = [];
    const validated = {};

    try {
      // Validate filters
      if (params.filters) {
        validated.filters = this.validateFilters(params.filters, errors);
      }

      // Validate sort
      if (params.sort !== undefined) {
        validated.sort = this.validateSort(params.sort, errors);
      }

      // Validate pagination
      if (params.pagination) {
        validated.pagination = this.validatePagination(
          params.pagination,
          errors,
        );
      }

      // If there are validation errors, throw comprehensive error
      if (errors.length > 0) {
        throw new AppError(
          `Validation failed: ${errors.join("; ")}`,
          400,
          "VALIDATION_ERROR",
          { validationErrors: errors },
        );
      }

      return validated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "[CampaignValidationService] Unexpected validation error:",
        error,
      );
      throw new AppError("Invalid request parameters", 400, "VALIDATION_ERROR");
    }
  }

  /**
   * Validate filter parameters
   * @param {Object} filters - Filter parameters
   * @param {Array} errors - Error collection array
   * @returns {Object} - Validated filters
   */
  validateFilters(filters, errors = []) {
    const validated = {};

    // Validate disaster type
    if (filters.disasterType !== undefined) {
      const result = this.validateDisasterType(filters.disasterType);
      if (result.isValid) {
        validated.disasterType = result.value;
      } else {
        errors.push(result.error);
      }
    }

    // Validate location
    if (filters.location !== undefined) {
      const result = this.validateLocation(filters.location);
      if (result.isValid) {
        validated.location = result.value;
      } else {
        errors.push(result.error);
      }
    }

    // Validate trust score range
    const trustScoreResult = this.validateRange(
      filters.trustScoreMin,
      filters.trustScoreMax,
      "trustScore",
      "Trust score",
    );
    if (trustScoreResult.isValid) {
      if (trustScoreResult.min !== undefined)
        validated.trustScoreMin = trustScoreResult.min;
      if (trustScoreResult.max !== undefined)
        validated.trustScoreMax = trustScoreResult.max;
    } else {
      errors.push(trustScoreResult.error);
    }

    // Validate funding progress range
    const fundingProgressResult = this.validateRange(
      filters.fundingProgressMin,
      filters.fundingProgressMax,
      "fundingProgress",
      "Funding progress",
    );
    if (fundingProgressResult.isValid) {
      if (fundingProgressResult.min !== undefined)
        validated.fundingProgressMin = fundingProgressResult.min;
      if (fundingProgressResult.max !== undefined)
        validated.fundingProgressMax = fundingProgressResult.max;
    } else {
      errors.push(fundingProgressResult.error);
    }

    // Validate target amount range
    const targetAmountResult = this.validateRange(
      filters.targetAmountMin,
      filters.targetAmountMax,
      "targetAmount",
      "Target amount",
    );
    if (targetAmountResult.isValid) {
      if (targetAmountResult.min !== undefined)
        validated.targetAmountMin = targetAmountResult.min;
      if (targetAmountResult.max !== undefined)
        validated.targetAmountMax = targetAmountResult.max;
    } else {
      errors.push(targetAmountResult.error);
    }

    // Validate NGO verification status
    if (filters.ngoVerificationStatus !== undefined) {
      const result = this.validateVerificationStatus(
        filters.ngoVerificationStatus,
      );
      if (result.isValid) {
        validated.ngoVerificationStatus = result.value;
      } else {
        errors.push(result.error);
      }
    }

    // Validate numeric fields
    const numericFields = [
      { key: "maxAge", name: "Maximum age" },
      { key: "endingWithinDays", name: "Ending within days" },
      {
        key: "minTransparencyScore",
        name: "Minimum transparency score",
        rule: "transparencyScore",
      },
      { key: "minProofCount", name: "Minimum proof count", rule: "proofCount" },
    ];

    numericFields.forEach(({ key, name, rule }) => {
      if (filters[key] !== undefined) {
        const result = this.validateNumericField(
          filters[key],
          rule || key,
          name,
        );
        if (result.isValid) {
          validated[key] = result.value;
        } else {
          errors.push(result.error);
        }
      }
    });

    // Validate search text
    if (filters.search !== undefined) {
      const result = this.validateSearchText(filters.search);
      if (result.isValid) {
        validated.search = result.value;
      } else {
        errors.push(result.error);
      }
    }

    return validated;
  }

  /**
   * Validate disaster type parameter
   * @param {String|Array} disasterType - Disaster type(s)
   * @returns {Object} - Validation result
   */
  validateDisasterType(disasterType) {
    try {
      if (typeof disasterType === "string") {
        const upperType = disasterType.toUpperCase().trim();
        if (!this.VALID_DISASTER_TYPES.includes(upperType)) {
          return {
            isValid: false,
            error: `Invalid disaster type '${disasterType}'. Valid options: ${this.VALID_DISASTER_TYPES.join(", ")}`,
          };
        }
        return { isValid: true, value: [upperType] };
      }

      if (Array.isArray(disasterType)) {
        if (disasterType.length === 0) {
          return {
            isValid: false,
            error: "Disaster type array cannot be empty",
          };
        }

        if (disasterType.length > 5) {
          return {
            isValid: false,
            error: "Maximum 5 disaster types allowed",
          };
        }

        const validTypes = [];
        const invalidTypes = [];

        disasterType.forEach((type) => {
          if (typeof type === "string") {
            const upperType = type.toUpperCase().trim();
            if (this.VALID_DISASTER_TYPES.includes(upperType)) {
              if (!validTypes.includes(upperType)) {
                validTypes.push(upperType);
              }
            } else {
              invalidTypes.push(type);
            }
          } else {
            invalidTypes.push(type);
          }
        });

        if (invalidTypes.length > 0) {
          return {
            isValid: false,
            error: `Invalid disaster types: ${invalidTypes.join(", ")}. Valid options: ${this.VALID_DISASTER_TYPES.join(", ")}`,
          };
        }

        return { isValid: true, value: validTypes };
      }

      return {
        isValid: false,
        error: "Disaster type must be a string or array of strings",
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid disaster type format",
      };
    }
  }

  /**
   * Validate location parameter
   * @param {String} location - Location string
   * @returns {Object} - Validation result
   */
  validateLocation(location) {
    try {
      if (typeof location !== "string") {
        return {
          isValid: false,
          error: "Location must be a string",
        };
      }

      const trimmed = location.trim();

      if (trimmed.length < this.VALIDATION_RULES.locationLength.min) {
        return {
          isValid: false,
          error: `Location must be at least ${this.VALIDATION_RULES.locationLength.min} characters long`,
        };
      }

      if (trimmed.length > this.VALIDATION_RULES.locationLength.max) {
        return {
          isValid: false,
          error: `Location must be no more than ${this.VALIDATION_RULES.locationLength.max} characters long`,
        };
      }

      // Basic sanitization - remove potentially harmful characters
      const sanitized = trimmed.replace(/[<>\"'&]/g, "");

      return { isValid: true, value: sanitized };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid location format",
      };
    }
  }

  /**
   * Validate range parameters (min/max pairs)
   * @param {*} minValue - Minimum value
   * @param {*} maxValue - Maximum value
   * @param {String} ruleKey - Validation rule key
   * @param {String} fieldName - Human-readable field name
   * @returns {Object} - Validation result
   */
  validateRange(minValue, maxValue, ruleKey, fieldName) {
    try {
      const rule = this.VALIDATION_RULES[ruleKey];
      if (!rule) {
        return {
          isValid: false,
          error: `No validation rule found for ${fieldName}`,
        };
      }

      let validatedMin, validatedMax;

      // Validate minimum value
      if (minValue !== undefined) {
        const minResult = this.validateNumericField(
          minValue,
          ruleKey,
          `${fieldName} minimum`,
        );
        if (!minResult.isValid) {
          return minResult;
        }
        validatedMin = minResult.value;
      }

      // Validate maximum value
      if (maxValue !== undefined) {
        const maxResult = this.validateNumericField(
          maxValue,
          ruleKey,
          `${fieldName} maximum`,
        );
        if (!maxResult.isValid) {
          return maxResult;
        }
        validatedMax = maxResult.value;
      }

      // Validate range relationship
      if (validatedMin !== undefined && validatedMax !== undefined) {
        if (validatedMin > validatedMax) {
          // Auto-swap for user convenience
          [validatedMin, validatedMax] = [validatedMax, validatedMin];
        }
      }

      return {
        isValid: true,
        min: validatedMin,
        max: validatedMax,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid ${fieldName} range format`,
      };
    }
  }

  /**
   * Validate numeric field
   * @param {*} value - Value to validate
   * @param {String} ruleKey - Validation rule key
   * @param {String} fieldName - Human-readable field name
   * @returns {Object} - Validation result
   */
  validateNumericField(value, ruleKey, fieldName) {
    try {
      const rule = this.VALIDATION_RULES[ruleKey];
      if (!rule) {
        return {
          isValid: false,
          error: `No validation rule found for ${fieldName}`,
        };
      }

      // Convert to number
      const numValue = Number(value);

      if (isNaN(numValue)) {
        return {
          isValid: false,
          error: `${fieldName} must be a valid number`,
        };
      }

      if (!Number.isInteger(numValue)) {
        return {
          isValid: false,
          error: `${fieldName} must be an integer`,
        };
      }

      if (numValue < rule.min) {
        return {
          isValid: false,
          error: `${fieldName} must be at least ${rule.min}`,
        };
      }

      if (numValue > rule.max) {
        return {
          isValid: false,
          error: `${fieldName} must be no more than ${rule.max}`,
        };
      }

      return { isValid: true, value: numValue };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid ${fieldName} format`,
      };
    }
  }

  /**
   * Validate verification status parameter
   * @param {String|Array} status - Verification status(es)
   * @returns {Object} - Validation result
   */
  validateVerificationStatus(status) {
    try {
      if (typeof status === "string") {
        const upperStatus = status.toUpperCase().trim();
        if (!this.VALID_VERIFICATION_STATUSES.includes(upperStatus)) {
          return {
            isValid: false,
            error: `Invalid verification status '${status}'. Valid options: ${this.VALID_VERIFICATION_STATUSES.join(", ")}`,
          };
        }
        return { isValid: true, value: [upperStatus] };
      }

      if (Array.isArray(status)) {
        if (status.length === 0) {
          return {
            isValid: false,
            error: "Verification status array cannot be empty",
          };
        }

        const validStatuses = [];
        const invalidStatuses = [];

        status.forEach((s) => {
          if (typeof s === "string") {
            const upperStatus = s.toUpperCase().trim();
            if (this.VALID_VERIFICATION_STATUSES.includes(upperStatus)) {
              if (!validStatuses.includes(upperStatus)) {
                validStatuses.push(upperStatus);
              }
            } else {
              invalidStatuses.push(s);
            }
          } else {
            invalidStatuses.push(s);
          }
        });

        if (invalidStatuses.length > 0) {
          return {
            isValid: false,
            error: `Invalid verification statuses: ${invalidStatuses.join(", ")}. Valid options: ${this.VALID_VERIFICATION_STATUSES.join(", ")}`,
          };
        }

        return { isValid: true, value: validStatuses };
      }

      return {
        isValid: false,
        error: "Verification status must be a string or array of strings",
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid verification status format",
      };
    }
  }

  /**
   * Validate search text parameter
   * @param {String} search - Search text
   * @returns {Object} - Validation result
   */
  validateSearchText(search) {
    try {
      if (typeof search !== "string") {
        return {
          isValid: false,
          error: "Search text must be a string",
        };
      }

      const trimmed = search.trim();

      if (trimmed.length < this.VALIDATION_RULES.searchLength.min) {
        return {
          isValid: false,
          error: `Search text must be at least ${this.VALIDATION_RULES.searchLength.min} characters long`,
        };
      }

      if (trimmed.length > this.VALIDATION_RULES.searchLength.max) {
        return {
          isValid: false,
          error: `Search text must be no more than ${this.VALIDATION_RULES.searchLength.max} characters long`,
        };
      }

      // Basic sanitization - remove potentially harmful characters
      const sanitized = trimmed.replace(/[<>\"'&]/g, "");

      return { isValid: true, value: sanitized };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid search text format",
      };
    }
  }

  /**
   * Validate sort parameter
   * @param {String} sort - Sort option
   * @param {Array} errors - Error collection array
   * @returns {String} - Validated sort option
   */
  validateSort(sort, errors = []) {
    try {
      if (typeof sort !== "string") {
        errors.push("Sort parameter must be a string");
        return "recent"; // Default fallback
      }

      const normalizedSort = sort.toLowerCase().trim();

      if (!this.VALID_SORT_OPTIONS.includes(normalizedSort)) {
        errors.push(
          `Invalid sort option '${sort}'. Valid options: ${this.VALID_SORT_OPTIONS.join(", ")}`,
        );
        return "recent"; // Default fallback
      }

      return normalizedSort;
    } catch (error) {
      errors.push("Invalid sort parameter format");
      return "recent"; // Default fallback
    }
  }

  /**
   * Validate pagination parameters
   * @param {Object} pagination - Pagination parameters
   * @param {Array} errors - Error collection array
   * @returns {Object} - Validated pagination
   */
  validatePagination(pagination, errors = []) {
    const validated = {};

    // Validate page
    if (pagination.page !== undefined) {
      const pageResult = this.validateNumericField(
        pagination.page,
        "page",
        "Page number",
      );
      if (pageResult.isValid) {
        validated.page = pageResult.value;
      } else {
        errors.push(pageResult.error);
        validated.page = 1; // Default fallback
      }
    } else {
      validated.page = 1; // Default
    }

    // Validate limit
    if (pagination.limit !== undefined) {
      const limitResult = this.validateNumericField(
        pagination.limit,
        "limit",
        "Page limit",
      );
      if (limitResult.isValid) {
        validated.limit = limitResult.value;
      } else {
        errors.push(limitResult.error);
        validated.limit = 12; // Default fallback
      }
    } else {
      validated.limit = 12; // Default
    }

    return validated;
  }

  /**
   * Validate donor ID parameter
   * @param {String} donorId - Donor user ID
   * @returns {Object} - Validation result
   */
  validateDonorId(donorId) {
    try {
      if (!donorId || typeof donorId !== "string") {
        return {
          isValid: false,
          error: "Donor ID is required and must be a string",
        };
      }

      const trimmed = donorId.trim();

      if (trimmed.length === 0) {
        return {
          isValid: false,
          error: "Donor ID cannot be empty",
        };
      }

      // Basic MongoDB ObjectId format validation (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(trimmed)) {
        return {
          isValid: false,
          error: "Donor ID must be a valid MongoDB ObjectId",
        };
      }

      return { isValid: true, value: trimmed };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid donor ID format",
      };
    }
  }
}

export default new CampaignValidationService();
