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
    if (score >= 70) return "bg-[var(--color-verified)]";
    if (score >= 40) return "bg-[var(--color-caution)]";
    return "bg-[var(--color-alert)]";
  };

  const getBarBgColor = (score) => {
    if (score >= 70) return "bg-[var(--color-verified-light)]";
    if (score >= 40) return "bg-[var(--color-caution-light)]";
    return "bg-[var(--color-alert-light)]";
  };

  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "var(--space-4)" }}>
        Trust factor breakdown
      </h3>

      <div className="space-y-4">
        {factorConfig.map((factor) => {
          const score = factors[factor.key] || 0;
          const weightedScore = (score * factor.weight) / 100;

          return (
            <div key={factor.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "13px" }}>
                      {factor.label}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-faint)" }}>
                      ({factor.weight}% weight)
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-faint)", marginTop: "2px" }}>
                    {factor.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-mono)", minWidth: "3rem", textAlign: "right" }}>
                    {score}/100
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--color-text-faint)", fontFamily: "var(--font-mono)", minWidth: "3rem", textAlign: "right" }}>
                    = {weightedScore.toFixed(1)} pts
                  </span>
                </div>
              </div>

              <div
                className={`w-full h-2 rounded-full ${getBarBgColor(score)}`}
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
      <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between">
          <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "14px" }}>Total trust score</span>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-signal)", fontFamily: "var(--font-mono)" }}>
            {Object.entries(factors)
              .reduce((total, [key, score]) => {
                const factor = factorConfig.find((f) => f.key === key);
                return total + (score * (factor?.weight || 0)) / 100;
              }, 0)
              .toFixed(0)}
            <span style={{ fontSize: "13px", color: "var(--color-text-faint)", marginLeft: "4px" }}>/100</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrustFactorBreakdown;
