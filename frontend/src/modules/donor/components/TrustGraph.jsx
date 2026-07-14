import { useState, useMemo } from "react";
import PropTypes from "prop-types";

/**
 * TrustGraph Component
 *
 * Displays trust score evolution over time with factor breakdown.
 * Features:
 * - SVG-based line chart (no external dependencies)
 * - Trust score factors breakdown
 * - Significant change highlighting (>10 points)
 * - Campaign vs NGO trust score toggle
 * - Mobile-optimized display
 * - Interactive tooltips on hover
 */
export default function TrustGraph({ trustHistory, type = "campaign" }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [viewType, setViewType] = useState(type); // 'campaign' or 'ngo'

  if (!trustHistory || trustHistory.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "var(--space-6)" }}>
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">No trust score history</div>
        <div className="empty-state-desc">
          Trust scores will appear here as the donation progresses.
        </div>
      </div>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get data points based on view type
  const dataPoints = useMemo(() => {
    return trustHistory.map((entry) => ({
      timestamp: new Date(entry.timestamp),
      score: viewType === "campaign" ? entry.campaignScore : entry.ngoScore,
      factors: entry.factors,
      change: entry.change,
    }));
  }, [trustHistory, viewType]);

  // Calculate scales
  const minScore = Math.max(
    0,
    Math.min(...dataPoints.map((d) => d.score)) - 10,
  );
  const maxScore = Math.min(
    100,
    Math.max(...dataPoints.map((d) => d.score)) + 10,
  );
  const scoreRange = maxScore - minScore;

  const minTime = dataPoints[0].timestamp.getTime();
  const maxTime = dataPoints[dataPoints.length - 1].timestamp.getTime();
  const timeRange = maxTime - minTime || 1;

  // Scale functions
  const scaleX = (timestamp) => {
    return (
      padding.left + ((timestamp.getTime() - minTime) / timeRange) * chartWidth
    );
  };

  const scaleY = (score) => {
    return (
      padding.top +
      chartHeight -
      ((score - minScore) / scoreRange) * chartHeight
    );
  };

  // Generate path for line chart
  const linePath = dataPoints
    .map((point, i) => {
      const x = scaleX(point.timestamp);
      const y = scaleY(point.score);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Generate area path (for gradient fill)
  const areaPath =
    linePath +
    ` L ${scaleX(dataPoints[dataPoints.length - 1].timestamp)} ${padding.top + chartHeight}` +
    ` L ${scaleX(dataPoints[0].timestamp)} ${padding.top + chartHeight} Z`;

  // Y-axis ticks
  const yTicks = [minScore, (minScore + maxScore) / 2, maxScore];

  // X-axis ticks (show first, middle, last)
  const xTicks = [
    dataPoints[0],
    dataPoints[Math.floor(dataPoints.length / 2)],
    dataPoints[dataPoints.length - 1],
  ];

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return "var(--color-success)";
    if (score >= 60) return "var(--color-verified)";
    if (score >= 40) return "var(--color-caution)";
    return "var(--color-danger)";
  };

  // Current score
  const currentScore = dataPoints[dataPoints.length - 1].score;
  const currentFactors = dataPoints[dataPoints.length - 1].factors;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--color-border)",
        padding: "var(--space-4)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-4)",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "700",
              marginBottom: "4px",
            }}
          >
            📊 Trust Score Evolution
          </h3>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {dataPoints.length} data points
          </div>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "var(--color-surface-alt)",
            padding: "4px",
            borderRadius: "8px",
          }}
        >
          <button
            onClick={() => setViewType("campaign")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              background:
                viewType === "campaign"
                  ? "var(--color-primary)"
                  : "transparent",
              color:
                viewType === "campaign" ? "white" : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Campaign
          </button>
          <button
            onClick={() => setViewType("ngo")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              fontWeight: "600",
              border: "none",
              borderRadius: "6px",
              background:
                viewType === "ngo" ? "var(--color-primary)" : "transparent",
              color: viewType === "ngo" ? "white" : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            NGO
          </button>
        </div>
      </div>

      {/* Current Score Display */}
      <div
        style={{
          padding: "var(--space-3)",
          background: "var(--color-surface-alt)",
          borderRadius: "var(--radius)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-text-faint)",
                marginBottom: "4px",
              }}
            >
              Current {viewType === "campaign" ? "Campaign" : "NGO"} Trust Score
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: getScoreColor(currentScore),
              }}
            >
              {currentScore.toFixed(1)}
              <span
                style={{
                  fontSize: "16px",
                  color: "var(--color-text-muted)",
                  marginLeft: "4px",
                }}
              >
                / 100
              </span>
            </div>
          </div>

          {/* Score Change Indicator */}
          {dataPoints.length > 1 && (
            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-faint)",
                  marginBottom: "4px",
                }}
              >
                Change
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color:
                    dataPoints[dataPoints.length - 1].change > 0
                      ? "var(--color-success)"
                      : dataPoints[dataPoints.length - 1].change < 0
                        ? "var(--color-danger)"
                        : "var(--color-text-muted)",
                }}
              >
                {dataPoints[dataPoints.length - 1].change > 0 ? "+" : ""}
                {dataPoints[dataPoints.length - 1].change?.toFixed(1) || "0.0"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          overflowX: "auto",
          marginBottom: "var(--space-4)",
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ display: "block", minWidth: "600px" }}
        >
          {/* Gradient for area fill */}
          <defs>
            <linearGradient
              id="scoreGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: getScoreColor(currentScore),
                  stopOpacity: 0.3,
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: getScoreColor(currentScore),
                  stopOpacity: 0.05,
                }}
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={scaleY(tick)}
                x2={width - padding.right}
                y2={scaleY(tick)}
                stroke="var(--color-border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={scaleY(tick)}
                textAnchor="end"
                alignmentBaseline="middle"
                style={{
                  fontSize: "10px",
                  fill: "var(--color-text-faint)",
                }}
              >
                {tick.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#scoreGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={getScoreColor(currentScore)}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {dataPoints.map((point, i) => {
            const x = scaleX(point.timestamp);
            const y = scaleY(point.score);
            const isSignificantChange = Math.abs(point.change) > 10;

            return (
              <g key={i}>
                {/* Highlight significant changes */}
                {isSignificantChange && (
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={
                      point.change > 0
                        ? "var(--color-success)"
                        : "var(--color-danger)"
                    }
                    opacity="0.2"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={getScoreColor(point.score)}
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setSelectedPoint(i)}
                  onMouseLeave={() => setSelectedPoint(null)}
                />
              </g>
            );
          })}

          {/* X-axis labels */}
          {xTicks.map((point, i) => {
            const x = scaleX(point.timestamp);
            return (
              <text
                key={i}
                x={x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                style={{
                  fontSize: "10px",
                  fill: "var(--color-text-faint)",
                }}
              >
                {point.timestamp.toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}
              </text>
            );
          })}

          {/* Tooltip */}
          {selectedPoint !== null && (
            <g>
              <rect
                x={scaleX(dataPoints[selectedPoint].timestamp) - 60}
                y={scaleY(dataPoints[selectedPoint].score) - 50}
                width="120"
                height="40"
                fill="var(--color-ink)"
                rx="6"
              />
              <text
                x={scaleX(dataPoints[selectedPoint].timestamp)}
                y={scaleY(dataPoints[selectedPoint].score) - 32}
                textAnchor="middle"
                style={{ fontSize: "12px", fill: "white", fontWeight: "700" }}
              >
                {dataPoints[selectedPoint].score.toFixed(1)}
              </text>
              <text
                x={scaleX(dataPoints[selectedPoint].timestamp)}
                y={scaleY(dataPoints[selectedPoint].score) - 18}
                textAnchor="middle"
                style={{ fontSize: "9px", fill: "var(--color-steel-light)" }}
              >
                {dataPoints[selectedPoint].timestamp.toLocaleDateString(
                  "en-IN",
                )}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Trust Score Factors Breakdown */}
      {currentFactors && (
        <div>
          <h4
            style={{
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "var(--space-3)",
            }}
          >
            Score Breakdown
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "var(--space-2)",
            }}
          >
            {Object.entries(currentFactors).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: "10px 12px",
                  background: "var(--color-surface-alt)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--color-text-faint)",
                    marginBottom: "4px",
                    textTransform: "capitalize",
                  }}
                >
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: getScoreColor(value),
                  }}
                >
                  {typeof value === "number" ? value.toFixed(1) : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

TrustGraph.propTypes = {
  trustHistory: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      campaignScore: PropTypes.number,
      ngoScore: PropTypes.number,
      change: PropTypes.number,
      factors: PropTypes.object,
    }),
  ),
  type: PropTypes.oneOf(["campaign", "ngo"]),
};

TrustGraph.defaultProps = {
  trustHistory: [],
  type: "campaign",
};
