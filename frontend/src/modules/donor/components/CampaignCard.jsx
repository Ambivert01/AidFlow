import React from "react";
import { Link } from "react-router-dom";

/**
 * CampaignCard Component
 * Displays campaign information with trust score, funding progress, and key metrics
 * Optimized for donor campaign discovery interface
 */
const CampaignCard = ({
  campaign,
  onDonate,
  showTrustScore = true,
  showFundingProgress = true,
  className = "",
}) => {
  // Calculate funding progress percentage
  const fundingProgress =
    campaign.targetAmount > 0
      ? Math.min(100, (campaign.totalDonated / campaign.targetAmount) * 100)
      : 0;

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      // 1 crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 thousand
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  // Get trust score color and label
  const getTrustScoreDisplay = (score) => {
    if (score === null || score === undefined) {
      return {
        color: "bg-[var(--color-paper-alt)] text-[var(--color-steel)]",
        label: "Pending",
        description: "Trust score calculation in progress",
      };
    }

    if (score >= 80) {
      return {
        color: "bg-[var(--color-verified-light)] text-[var(--color-verified-dark)]",
        label: "High Trust",
        description: "Highly trusted campaign",
      };
    } else if (score >= 60) {
      return {
        color: "bg-[var(--color-caution-light)] text-[var(--color-caution)]",
        label: "Medium Trust",
        description: "Moderately trusted campaign",
      };
    } else {
      return {
        color: "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]",
        label: "Low Trust",
        description: "Lower trust score - review carefully",
      };
    }
  };

  // Get disaster type icon
  const getDisasterIcon = (type) => {
    const icons = {
      FLOOD: "🌊",
      EARTHQUAKE: "🏚️",
      FAMINE: "🌾",
      WAR: "⚔️",
      DROUGHT: "🏜️",
      PANDEMIC: "🦠",
      CYCLONE: "🌀",
      FIRE: "🔥",
      OTHER: "📋",
    };
    return icons[type] || "📋";
  };

  // Format location
  const formatLocation = (location) => {
    if (!location) return "Location not specified";

    const parts = [];
    if (location.ward) parts.push(location.ward);
    if (location.district) parts.push(location.district);
    if (location.state) parts.push(location.state);

    return parts.length > 0 ? parts.join(", ") : "Location not specified";
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;

    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const trustScoreDisplay = getTrustScoreDisplay(campaign.trustScore);
  const daysRemaining = getDaysRemaining(campaign.endDate);

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Header with Trust Score */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">
                {getDisasterIcon(campaign.disasterType)}
              </span>
              <span className="text-xs font-medium text-[var(--color-steel)] uppercase tracking-wide">
                {campaign.disasterType?.replace("_", " ")}
              </span>
              {daysRemaining !== null && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    daysRemaining <= 7
                      ? "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]"
                      : daysRemaining <= 30
                        ? "bg-[var(--color-caution-light)] text-[var(--color-caution)]"
                        : "bg-[var(--color-verified-light)] text-[var(--color-verified-dark)]"
                  }`}
                >
                  {daysRemaining === 0
                    ? "Ending today"
                    : `${daysRemaining} days left`}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-ink)] line-clamp-2 leading-tight">
              {campaign.title}
            </h3>
          </div>

          {showTrustScore && (
            <div className="ml-3 flex-shrink-0">
              <div
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${trustScoreDisplay.color}`}
              >
                {campaign.trustScore !== null &&
                campaign.trustScore !== undefined ? (
                  <>
                    <span className="font-bold">{campaign.trustScore}</span>
                    <span className="ml-1">/ 100</span>
                  </>
                ) : (
                  <span>Pending</span>
                )}
              </div>
              <div className="text-xs text-[var(--color-steel)] mt-1 text-center">
                {trustScoreDisplay.label}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--color-steel)] line-clamp-2 mb-3">
          {campaign.description}
        </p>

        {/* NGO Information */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            <svg
              className="w-4 h-4 text-[var(--color-steel)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v5"
              />
            </svg>
            <span className="text-sm text-[var(--color-steel)]">
              {campaign.ngoName || "NGO Name"}
            </span>
          </div>

          {campaign.ngoVerificationStatus && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                campaign.ngoVerificationStatus === "APPROVED"
                  ? "bg-[var(--color-verified-light)] text-[var(--color-verified-dark)]"
                  : campaign.ngoVerificationStatus === "PENDING"
                    ? "bg-[var(--color-caution-light)] text-[var(--color-caution)]"
                    : "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]"
              }`}
            >
              {campaign.ngoVerificationStatus === "APPROVED" && "✓ "}
              {campaign.ngoVerificationStatus === "APPROVED"
                ? "Verified"
                : campaign.ngoVerificationStatus}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center space-x-1 mb-4">
          <svg
            className="w-4 h-4 text-[var(--color-steel)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm text-[var(--color-steel)]">
            {formatLocation(campaign.location)}
          </span>
        </div>
      </div>

      {/* Funding Progress */}
      {showFundingProgress && (
        <div className="px-4 pb-4">
          <div className="mb-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--color-steel)]">
                Raised:{" "}
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(campaign.totalDonated)}
                </span>
              </span>
              <span className="text-[var(--color-steel)]">
                Goal:{" "}
                <span className="font-semibold text-[var(--color-ink)]">
                  {formatCurrency(campaign.targetAmount)}
                </span>
              </span>
            </div>
          </div>

          <div className="w-full bg-[var(--color-paper-alt)] rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                fundingProgress >= 100
                  ? "bg-[var(--color-verified)]"
                  : fundingProgress >= 75
                    ? "bg-[var(--color-signal)]"
                    : fundingProgress >= 50
                      ? "bg-[var(--color-caution)]"
                      : "bg-[var(--color-alert)]"
              }`}
              style={{ width: `${Math.min(100, fundingProgress)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs text-[var(--color-steel)]">
            <span>{fundingProgress.toFixed(1)}% funded</span>
            {campaign.proofCount > 0 && (
              <span>
                {campaign.proofCount} proof
                {campaign.proofCount !== 1 ? "s" : ""} submitted
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 pb-4">
        <div className="flex space-x-2">
          <Link
            to={`/campaigns/${campaign._id}`}
            className="flex-1 bg-[var(--color-paper-alt)] hover:bg-[var(--color-border)] text-[var(--color-ink)] font-medium py-2 px-4 rounded-md text-center text-sm transition-colors duration-200"
          >
            View Details
          </Link>
          <button
            onClick={() => onDonate?.(campaign)}
            className="flex-1 bg-[var(--color-signal)] hover:bg-[var(--color-signal-dark)] text-white font-medium py-2 px-4 rounded-md text-sm transition-colors duration-200"
          >
            Donate Now
          </button>
        </div>
      </div>

      {/* Additional Metrics */}
      {(campaign.transparencyScore > 0 || campaign.proofVerifiedCount > 0) && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex items-center justify-between text-xs text-[var(--color-steel)] border-t pt-3">
            {campaign.transparencyScore > 0 && (
              <div className="flex items-center space-x-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Transparency: {campaign.transparencyScore}%</span>
              </div>
            )}
            {campaign.proofVerifiedCount > 0 && (
              <div className="flex items-center space-x-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{campaign.proofVerifiedCount} verified proofs</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignCard;
