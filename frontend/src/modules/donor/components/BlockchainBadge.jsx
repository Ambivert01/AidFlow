import PropTypes from "prop-types";

/**
 * BlockchainBadge Component
 *
 * Displays blockchain verification status with transaction details.
 * Features:
 * - Status-based color coding (VERIFIED, PENDING, FAILED, NOT_ANCHORED)
 * - Block number and transaction hash display
 * - Blockchain explorer links
 * - Verification error messages
 * - Timestamp display
 */
export default function BlockchainBadge({ verification, compact = false }) {
  if (!verification) {
    return null;
  }

  const {
    status,
    network,
    txHash,
    blockNumber,
    timestamp,
    error,
    explorerUrl,
  } = verification;

  // Get status color and icon
  const getStatusStyle = () => {
    switch (status) {
      case "VERIFIED":
        return {
          color: "var(--color-success)",
          background: "rgba(34,197,94,0.12)",
          border: "var(--color-success)",
          icon: "✓",
          label: "Verified",
        };
      case "PENDING":
        return {
          color: "var(--color-caution)",
          background: "rgba(245,158,11,0.12)",
          border: "var(--color-caution)",
          icon: "⏳",
          label: "Pending",
        };
      case "FAILED":
        return {
          color: "var(--color-danger)",
          background: "rgba(239,68,68,0.12)",
          border: "var(--color-danger)",
          icon: "✗",
          label: "Failed",
        };
      case "NOT_ANCHORED":
        return {
          color: "var(--color-text-muted)",
          background: "var(--color-surface-alt)",
          border: "var(--color-border)",
          icon: "○",
          label: "Not Anchored",
        };
      default:
        return {
          color: "var(--color-text-muted)",
          background: "var(--color-surface-alt)",
          border: "var(--color-border)",
          icon: "?",
          label: "Unknown",
        };
    }
  };

  const statusStyle = getStatusStyle();

  // Get blockchain network icon
  const getNetworkIcon = () => {
    switch (network?.toUpperCase()) {
      case "ETHEREUM":
        return "Ξ";
      case "POLYGON":
        return "⬡";
      case "SOLANA":
        return "◎";
      default:
        return "⛓️";
    }
  };

  // Truncate hash for display
  const truncateHash = (hash) => {
    if (!hash) return "";
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  // Compact view - just a badge
  if (compact) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "10px",
          fontWeight: "600",
          background: statusStyle.background,
          color: statusStyle.color,
          border: `1px solid ${statusStyle.border}`,
        }}
      >
        <span>{statusStyle.icon}</span>
        <span>{statusStyle.label}</span>
        {network && <span style={{ opacity: 0.7 }}>· {network}</span>}
      </div>
    );
  }

  // Full view - detailed card
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "var(--radius)",
        background: statusStyle.background,
        border: `1.5px solid ${statusStyle.border}`,
        fontSize: "12px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "700",
            color: statusStyle.color,
          }}
        >
          <span style={{ fontSize: "16px" }}>{getNetworkIcon()}</span>
          <span>Blockchain Verification</span>
        </div>
        <div
          style={{
            padding: "3px 8px",
            borderRadius: "10px",
            fontSize: "10px",
            fontWeight: "700",
            background: statusStyle.color,
            color: "white",
          }}
        >
          {statusStyle.icon} {statusStyle.label}
        </div>
      </div>

      {/* Network */}
      {network && (
        <div style={{ marginBottom: "var(--space-2)" }}>
          <span style={{ color: "var(--color-text-faint)", fontSize: "10px" }}>
            Network:
          </span>{" "}
          <strong style={{ color: statusStyle.color }}>{network}</strong>
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && (
        <div
          style={{
            marginBottom: "var(--space-2)",
            padding: "8px 10px",
            background: "rgba(0,0,0,0.05)",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-text-faint)",
              marginBottom: "4px",
            }}
          >
            Transaction Hash
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              color: "var(--color-text)",
              wordBreak: "break-all",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span title={txHash}>{truncateHash(txHash)}</span>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "10px",
                  color: statusStyle.color,
                  textDecoration: "none",
                  fontWeight: "600",
                  flexShrink: 0,
                }}
              >
                View ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Block Number */}
      {blockNumber && (
        <div style={{ marginBottom: "var(--space-2)" }}>
          <span style={{ color: "var(--color-text-faint)", fontSize: "10px" }}>
            Block:
          </span>{" "}
          <strong style={{ fontFamily: "monospace", fontSize: "11px" }}>
            #{blockNumber.toLocaleString()}
          </strong>
        </div>
      )}

      {/* Timestamp */}
      {timestamp && (
        <div style={{ marginBottom: "var(--space-2)" }}>
          <span style={{ color: "var(--color-text-faint)", fontSize: "10px" }}>
            Anchored:
          </span>{" "}
          <span style={{ fontSize: "11px" }}>
            {new Date(timestamp).toLocaleString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && status === "FAILED" && (
        <div
          style={{
            marginTop: "var(--space-2)",
            padding: "8px 10px",
            background: "rgba(239,68,68,0.1)",
            borderRadius: "6px",
            fontSize: "11px",
            color: "var(--color-danger)",
            lineHeight: "1.5",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>
            ⚠️ Verification Error
          </div>
          {error}
        </div>
      )}

      {/* Pending Message */}
      {status === "PENDING" && (
        <div
          style={{
            marginTop: "var(--space-2)",
            padding: "8px 10px",
            background: "rgba(245,158,11,0.1)",
            borderRadius: "6px",
            fontSize: "10px",
            color: "var(--color-caution)",
            lineHeight: "1.5",
          }}
        >
          ⏳ Blockchain verification in progress. This may take a few minutes.
        </div>
      )}

      {/* Not Anchored Message */}
      {status === "NOT_ANCHORED" && (
        <div
          style={{
            marginTop: "var(--space-2)",
            padding: "8px 10px",
            background: "var(--color-surface-alt)",
            borderRadius: "6px",
            fontSize: "10px",
            color: "var(--color-text-muted)",
            lineHeight: "1.5",
          }}
        >
          This transaction has not been anchored to the blockchain yet.
        </div>
      )}

      {/* Immutability Badge */}
      {status === "VERIFIED" && (
        <div
          style={{
            marginTop: "var(--space-2)",
            padding: "6px 10px",
            background: "rgba(34,197,94,0.08)",
            borderRadius: "6px",
            fontSize: "10px",
            color: "var(--color-success)",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          🔒 Cryptographically Immutable
        </div>
      )}
    </div>
  );
}

BlockchainBadge.propTypes = {
  verification: PropTypes.shape({
    status: PropTypes.oneOf(["VERIFIED", "PENDING", "FAILED", "NOT_ANCHORED"])
      .isRequired,
    network: PropTypes.string,
    txHash: PropTypes.string,
    blockNumber: PropTypes.number,
    timestamp: PropTypes.string,
    error: PropTypes.string,
    explorerUrl: PropTypes.string,
  }),
  compact: PropTypes.bool,
};

BlockchainBadge.defaultProps = {
  verification: null,
  compact: false,
};
