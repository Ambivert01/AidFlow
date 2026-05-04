import React from "react";

/**
 * TrustScoreBadge Component
 * Displays trust score with color coding and optional label
 *
 * Color Coding:
 * - 0-40: Red (Low Trust)
 * - 40-70: Yellow (Medium Trust)
 * - 70-100: Green (High Trust)
 */
const TrustScoreBadge = ({
  score,
  size = "medium",
  showLabel = true,
  className = "",
}) => {
  // Determine color based on score
  const getColorClasses = () => {
    if (score >= 70) {
      return "bg-green-100 text-green-800 border-green-300";
    } else if (score >= 40) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    } else {
      return "bg-red-100 text-red-800 border-red-300";
    }
  };

  // Determine trust level text
  const getTrustLevel = () => {
    if (score >= 70) return "High Trust";
    if (score >= 40) return "Medium Trust";
    return "Low Trust";
  };

  // Size classes
  const sizeClasses = {
    small: "text-xs px-2 py-1",
    medium: "text-sm px-3 py-1.5",
    large: "text-base px-4 py-2",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`
          inline-flex items-center justify-center
          font-semibold rounded-full border-2
          ${getColorClasses()}
          ${sizeClasses[size]}
        `}
      >
        <span className="font-bold">{score}</span>
        <span className="ml-1 text-xs opacity-75">/100</span>
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600 font-medium">
          {getTrustLevel()}
        </span>
      )}
    </div>
  );
};

export default TrustScoreBadge;
