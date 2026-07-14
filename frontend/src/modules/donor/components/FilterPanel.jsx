import React, { useState, useEffect, useCallback } from "react";

// Simple debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * FilterPanel Component
 * Comprehensive filtering controls for campaign discovery
 * Supports disaster type, location, trust score, funding progress, NGO status, and more
 */
const FilterPanel = ({
  filters = {},
  onFiltersChange,
  onReset,
  isLoading = false,
  className = "",
}) => {
  // Local state for form inputs
  const [localFilters, setLocalFilters] = useState({
    disasterType: [],
    location: "",
    trustScoreMin: "",
    trustScoreMax: "",
    fundingProgressMin: "",
    fundingProgressMax: "",
    targetAmountMin: "",
    targetAmountMax: "",
    ngoVerificationStatus: [],
    maxAge: "",
    endingWithinDays: "",
    minTransparencyScore: "",
    minProofCount: "",
    search: "",
    ...filters,
  });

  // Disaster type options
  const disasterTypes = [
    { value: "FLOOD", label: "Flood", icon: "🌊" },
    { value: "EARTHQUAKE", label: "Earthquake", icon: "🏚️" },
    { value: "FAMINE", label: "Famine", icon: "🌾" },
    { value: "WAR", label: "War/Conflict", icon: "⚔️" },
    { value: "DROUGHT", label: "Drought", icon: "🏜️" },
    { value: "PANDEMIC", label: "Pandemic", icon: "🦠" },
    { value: "CYCLONE", label: "Cyclone", icon: "🌀" },
    { value: "FIRE", label: "Fire", icon: "🔥" },
    { value: "OTHER", label: "Other", icon: "📋" },
  ];

  // NGO verification status options
  const verificationStatuses = [
    { value: "APPROVED", label: "Verified NGOs", color: "green" },
    { value: "PENDING", label: "Pending Verification", color: "yellow" },
    { value: "REJECTED", label: "Rejected NGOs", color: "red" },
  ];

  // Debounced filter change handler
  const debouncedOnFiltersChange = useCallback(
    debounce((newFilters) => {
      onFiltersChange?.(newFilters);
    }, 300),
    [onFiltersChange],
  );

  // Update parent when local filters change
  useEffect(() => {
    // Clean up empty values before sending to parent
    const cleanFilters = Object.entries(localFilters).reduce(
      (acc, [key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          if (Array.isArray(value) && value.length > 0) {
            acc[key] = value;
          } else if (!Array.isArray(value)) {
            acc[key] = value;
          }
        }
        return acc;
      },
      {},
    );

    debouncedOnFiltersChange(cleanFilters);
  }, [localFilters, debouncedOnFiltersChange]);

  // Handle input changes
  const handleInputChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle array input changes (checkboxes)
  const handleArrayChange = (key, value, checked) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: checked
        ? [...prev[key], value]
        : prev[key].filter((item) => item !== value),
    }));
  };

  // Handle range input changes
  const handleRangeChange = (minKey, maxKey, minValue, maxValue) => {
    setLocalFilters((prev) => ({
      ...prev,
      [minKey]: minValue,
      [maxKey]: maxValue,
    }));
  };

  // Reset all filters
  const handleReset = () => {
    const resetFilters = {
      disasterType: [],
      location: "",
      trustScoreMin: "",
      trustScoreMax: "",
      fundingProgressMin: "",
      fundingProgressMax: "",
      targetAmountMin: "",
      targetAmountMax: "",
      ngoVerificationStatus: [],
      maxAge: "",
      endingWithinDays: "",
      minTransparencyScore: "",
      minProofCount: "",
      search: "",
    };
    setLocalFilters(resetFilters);
    onReset?.();
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.entries(localFilters).reduce((count, [key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        if (Array.isArray(value) && value.length > 0) {
          return count + 1;
        } else if (!Array.isArray(value)) {
          return count + 1;
        }
      }
      return count;
    }, 0);
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-[var(--color-signal-light)] text-[var(--color-signal-dark)] text-xs font-medium px-2.5 py-0.5 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-[var(--color-steel)] hover:text-[var(--color-ink)] underline"
            disabled={isLoading}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
            Search Campaigns
          </label>
          <div className="relative">
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleInputChange("search", e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-[var(--color-steel)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Disaster Type */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
            Disaster Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {disasterTypes.map((type) => (
              <label
                key={type.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localFilters.disasterType.includes(type.value)}
                  onChange={(e) =>
                    handleArrayChange(
                      "disasterType",
                      type.value,
                      e.target.checked,
                    )
                  }
                  className="rounded border-[var(--color-steel)] text-[var(--color-signal)] focus:ring-[var(--color-signal)]"
                  disabled={isLoading}
                />
                <span className="text-sm text-[var(--color-ink)]">
                  {type.icon} {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
            Location
          </label>
          <input
            type="text"
            value={localFilters.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder="State, district, or city..."
            className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
            disabled={isLoading}
          />
        </div>

        {/* Trust Score Range */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
            Trust Score Range (0-100)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.trustScoreMin}
                onChange={(e) =>
                  handleInputChange("trustScoreMin", e.target.value)
                }
                placeholder="Min"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.trustScoreMax}
                onChange={(e) =>
                  handleInputChange("trustScoreMax", e.target.value)
                }
                placeholder="Max"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>
          </div>
          {(localFilters.trustScoreMin || localFilters.trustScoreMax) && (
            <div className="mt-2 text-xs text-[var(--color-steel)]">
              Range: {localFilters.trustScoreMin || 0} -{" "}
              {localFilters.trustScoreMax || 100}
            </div>
          )}
        </div>

        {/* Funding Progress Range */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
            Funding Progress (%)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.fundingProgressMin}
                onChange={(e) =>
                  handleInputChange("fundingProgressMin", e.target.value)
                }
                placeholder="Min %"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.fundingProgressMax}
                onChange={(e) =>
                  handleInputChange("fundingProgressMax", e.target.value)
                }
                placeholder="Max %"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Target Amount Range */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
            Target Amount (₹)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                value={localFilters.targetAmountMin}
                onChange={(e) =>
                  handleInputChange("targetAmountMin", e.target.value)
                }
                placeholder="Min amount"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="number"
                min="0"
                value={localFilters.targetAmountMax}
                onChange={(e) =>
                  handleInputChange("targetAmountMax", e.target.value)
                }
                placeholder="Max amount"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* NGO Verification Status */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">
            NGO Verification Status
          </label>
          <div className="space-y-2">
            {verificationStatuses.map((status) => (
              <label
                key={status.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localFilters.ngoVerificationStatus.includes(
                    status.value,
                  )}
                  onChange={(e) =>
                    handleArrayChange(
                      "ngoVerificationStatus",
                      status.value,
                      e.target.checked,
                    )
                  }
                  className="rounded border-[var(--color-steel)] text-[var(--color-signal)] focus:ring-[var(--color-signal)]"
                  disabled={isLoading}
                />
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status.color === "green"
                      ? "bg-[var(--color-verified-light)] text-[var(--color-verified-dark)]"
                      : status.color === "yellow"
                        ? "bg-[var(--color-caution-light)] text-[var(--color-caution)]"
                        : "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]"
                  }`}
                >
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-ink)]">
            <span>Advanced Filters</span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>

          <div className="mt-4 space-y-4 pl-4 border-l-2 border-[var(--color-paper-alt)]">
            {/* Campaign Age */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Maximum Campaign Age (days)
              </label>
              <input
                type="number"
                min="1"
                max="3650"
                value={localFilters.maxAge}
                onChange={(e) => handleInputChange("maxAge", e.target.value)}
                placeholder="e.g., 30"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>

            {/* Ending Soon */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Ending Within (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={localFilters.endingWithinDays}
                onChange={(e) =>
                  handleInputChange("endingWithinDays", e.target.value)
                }
                placeholder="e.g., 7"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>

            {/* Transparency Score */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Minimum Transparency Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={localFilters.minTransparencyScore}
                onChange={(e) =>
                  handleInputChange("minTransparencyScore", e.target.value)
                }
                placeholder="0-100"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>

            {/* Proof Count */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
                Minimum Proof Submissions
              </label>
              <input
                type="number"
                min="0"
                value={localFilters.minProofCount}
                onChange={(e) =>
                  handleInputChange("minProofCount", e.target.value)
                }
                placeholder="e.g., 5"
                className="w-full px-3 py-2 border border-[var(--color-steel)] rounded-md focus:ring-[var(--color-signal)] focus:border-[var(--color-signal)]"
                disabled={isLoading}
              />
            </div>
          </div>
        </details>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-4 flex items-center justify-center text-sm text-[var(--color-steel)]">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-[var(--color-signal)]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Applying filters...
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
