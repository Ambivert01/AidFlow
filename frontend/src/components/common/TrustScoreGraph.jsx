import React, { useState, useEffect } from "react";
import axios from "axios";

/**
 * TrustScoreGraph Component
 * Displays trust score history as a line chart
 */
const TrustScoreGraph = ({ entityId, entityType, timeRange = 50 }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrustHistory();
  }, [entityId, entityType, timeRange]);

  const fetchTrustHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `/api/trust/history/${entityType.toLowerCase()}/${entityId}?limit=${timeRange}`,
      );

      // Reverse to show oldest first
      const historyData = response.data.data.reverse();
      setHistory(historyData);
    } catch (err) {
      console.error("Error fetching trust history:", err);
      setError("Failed to load trust history");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#10B981"; // Green
    if (score >= 40) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No trust history available</p>
      </div>
    );
  }

  // Calculate chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const maxScore = 100;
  const minScore = 0;
  const xScale = chartWidth / (history.length - 1);
  const yScale = chartHeight / (maxScore - minScore);

  // Generate path for line chart
  const generatePath = () => {
    return history
      .map((point, index) => {
        const x = padding.left + index * xScale;
        const y =
          padding.top + chartHeight - (point.newScore - minScore) * yScale;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Generate area path (for gradient fill)
  const generateAreaPath = () => {
    const linePath = generatePath();
    const lastPoint = history[history.length - 1];
    const lastX = padding.left + (history.length - 1) * xScale;
    const bottomY = padding.top + chartHeight;

    return `${linePath} L ${lastX} ${bottomY} L ${padding.left} ${bottomY} Z`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Trust Score History</h3>

      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((score) => {
          const y = padding.top + chartHeight - (score - minScore) * yScale;
          return (
            <g key={score}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6B7280"
              >
                {score}
              </text>
            </g>
          );
        })}

        {/* Area gradient */}
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={generateAreaPath()} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={generatePath()}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {history.map((point, index) => {
          const x = padding.left + index * xScale;
          const y =
            padding.top + chartHeight - (point.newScore - minScore) * yScale;

          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={getScoreColor(point.newScore)}
                stroke="white"
                strokeWidth="2"
              />

              {/* Tooltip on hover */}
              <title>
                {formatDate(point.createdAt)}: {point.newScore}
                {point.delta !== 0 &&
                  ` (${point.delta > 0 ? "+" : ""}${point.delta})`}
              </title>
            </g>
          );
        })}

        {/* X-axis labels (show every nth label to avoid crowding) */}
        {history.map((point, index) => {
          if (
            index % Math.ceil(history.length / 5) !== 0 &&
            index !== history.length - 1
          ) {
            return null;
          }

          const x = padding.left + index * xScale;
          const y = height - padding.bottom + 20;

          return (
            <text
              key={index}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              {formatDate(point.createdAt)}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">High Trust (70-100)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600">Medium Trust (40-70)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Low Trust (0-40)</span>
        </div>
      </div>
    </div>
  );
};

export default TrustScoreGraph;
