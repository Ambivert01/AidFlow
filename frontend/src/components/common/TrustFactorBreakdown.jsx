import React from "react";

/**
 * TrustFactorBreakdown Component
 * Displays horizontal bar chart showing trust factor breakdown
 */
const TrustFactorBreakdown = ({ factors }) => {
  const factorConfig = [
    {
      key: "proofScore",
      label: "Proof Validation",
      weight: 40,
      description: "Based on verified vs rejected proofs",
    },
    {
      key: "aiScore",
      label: "AI Risk Assessment",
      weight: 25,
      description: "Based on AI fraud detection scores",
    },
    {
      key: "timelinessScore",
      label: "Timeliness",
      weight: 15,
      description: "Based on proof upload delays",
    },
    {
      key: "fraudPenalty",
      label: "Fraud History",
      weight: 10,
      description: "Based on fraud alerts",
    },
    {
      key: "consistencyScore",
      label: "Activity Consistency",
      weight: 10,
      description: "Based on regular activity",
    },
  ];

  const getBarColor = (score) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getBarBgColor = (score) => {
    if (score >= 70) return "bg-green-100";
    if (score >= 40) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Trust Factor Breakdown</h3>

      <div className="space-y-4">
        {factorConfig.map((factor) => {
          const score = factors[factor.key] || 0;
          const weightedScore = (score * factor.weight) / 100;

          return (
            <div key={factor.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">
                      {factor.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({factor.weight}% weight)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {factor.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
                    {score}/100
                  </span>
                  <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                    = {weightedScore.toFixed(1)} pts
                  </span>
                </div>
              </div>

              <div
                className={`w-full h-3 rounded-full ${getBarBgColor(score)}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Score */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800">Total Trust Score</span>
          <span className="text-2xl font-bold text-blue-600">
            {Object.entries(factors)
              .reduce((total, [key, score]) => {
                const factor = factorConfig.find((f) => f.key === key);
                return total + (score * (factor?.weight || 0)) / 100;
              }, 0)
              .toFixed(0)}
            <span className="text-sm text-gray-500 ml-1">/100</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustFactorBreakdown;
