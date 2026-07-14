import PropTypes from "prop-types";

/**
 * TimelineWarnings Component
 *
 * Displays warning messages when data sources are unavailable.
 * Provides graceful degradation messaging to users.
 */
export default function TimelineWarnings({ warnings, onDismiss }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  const getWarningIcon = (type) => {
    switch (type) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  const getWarningColor = (type) => {
    switch (type) {
      case "error":
        return {
          background: "rgba(239,68,68,0.1)",
          border: "var(--color-danger)",
          color: "var(--color-danger)",
        };
      case "warning":
        return {
          background: "rgba(251,146,60,0.1)",
          border: "var(--color-signal)",
          color: "var(--color-signal)",
        };
      case "info":
        return {
          background: "rgba(59,130,246,0.1)",
          border: "var(--color-info)",
          color: "var(--color-info)",
        };
      default:
        return {
          background: "rgba(59,130,246,0.1)",
          border: "var(--color-info)",
          color: "var(--color-info)",
        };
    }
  };

  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      {warnings.map((warning, index) => {
        const colors = getWarningColor(warning.type);

        return (
          <div
            key={index}
            style={{
              padding: "var(--space-3)",
              marginBottom: "var(--space-2)",
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderLeft: `4px solid ${colors.border}`,
              borderRadius: "var(--radius)",
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-3)",
            }}
          >
            <div style={{ fontSize: "20px", flexShrink: 0 }}>
              {getWarningIcon(warning.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: colors.color,
                  marginBottom: "4px",
                }}
              >
                {warning.message}
              </div>

              {warning.action && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {warning.action}
                </div>
              )}

              {warning.details && (
                <details style={{ marginTop: "var(--space-2)" }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Technical Details
                  </summary>
                  <pre
                    style={{
                      fontSize: "10px",
                      marginTop: "var(--space-2)",
                      padding: "var(--space-2)",
                      background: "rgba(0,0,0,0.05)",
                      borderRadius: "4px",
                      overflow: "auto",
                    }}
                  >
                    {warning.details}
                  </pre>
                </details>
              )}
            </div>

            {onDismiss && (
              <button
                onClick={() => onDismiss(index)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "var(--color-text-muted)",
                  padding: "0",
                  flexShrink: 0,
                }}
                aria-label="Dismiss warning"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

TimelineWarnings.propTypes = {
  warnings: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(["error", "warning", "info"]).isRequired,
      message: PropTypes.string.isRequired,
      action: PropTypes.string,
      details: PropTypes.string,
    }),
  ),
  onDismiss: PropTypes.func,
};

TimelineWarnings.defaultProps = {
  warnings: [],
  onDismiss: null,
};
