import { useState } from "react";
import PropTypes from "prop-types";

const EVENT_LABELS = {
  DONATION_CREATED: "Donation Received",
  DONATION_INITIATED: "Donation Initiated",
  AI_DECISION: "AI Risk Evaluation Complete",
  AI_APPROVED: "AI Approved",
  AI_BLOCKED: "AI Blocked",
  AI_ESCALATED: "AI Escalated",
  AI_REVIEW_REQUIRED: "AI Review Required",
  BENEFICIARY_AI_EVALUATED: "AI Evaluated Beneficiary",
  BENEFICIARY_ASSIGNED: "Beneficiary Assigned",
  DONATION_BENEFICIARY_ASSIGNED: "NGO Assigned Beneficiary",
  DONATION_APPROVED_BY_NGO: "NGO Approved — Wallet Created",
  DONATION_REJECTED_BY_NGO: "NGO Rejected Donation",
  NGO_APPROVED: "NGO Approved",
  NGO_REJECTED: "NGO Rejected",
  WALLET_CREATED: "Aid Wallet Activated",
  WALLET_ALLOCATED: "Wallet Allocated",
  WALLET_SPENT: "Aid Spent by Beneficiary",
  DONATION_APPROVED_BY_GOVT: "Government Cleared",
  DONATION_REJECTED_BY_GOVT: "Government Rejected",
  GOVT_APPROVED: "Government Approved",
  GOVT_REJECTED: "Government Rejected",
  PROOF_UPLOADED: "Proof Uploaded",
  PROOF_VERIFIED: "Proof Verified",
  PROOF_REJECTED: "Proof Rejected",
  PROOF_AI_VALIDATED: "AI Validated Proof",
  PROOF_MANUAL_REVIEWED: "Manual Review Complete",
  BLOCKCHAIN_ANCHORED: "⛓️ Blockchain Anchored",
  BLOCKCHAIN_ANCHORING: "Blockchain Anchoring",
  DONATION_PROCESSING_FAILED: "❌ Processing Failed",
  WORKFLOW_AUDIT_FINALIZED: "✅ Audit Finalized & Blockchain Anchored",
  MERCHANT_CATEGORY_VIOLATION: "⚠️ Category Violation Detected",
  TRUST_UPDATED: "Trust Score Updated",
  TRUST_SCORE_CHANGED: "Trust Score Changed",
};

/**
 * TimelineItem Component
 *
 * Displays an individual timeline event with expandable details.
 * Features:
 * - Color-coded event dots based on event type
 * - Expandable metadata section
 * - Touch-friendly design for mobile
 * - Actor information display
 * - Timestamp formatting
 */
export default function TimelineItem({ event, index }) {
  const [expanded, setExpanded] = useState(false);

  // Determine event type for styling
  const isError =
    event.eventType?.includes("REJECT") ||
    event.eventType?.includes("FAIL") ||
    event.eventType?.includes("VIOLATION");
  const isFinal =
    event.eventType?.includes("FINALIZED") ||
    event.eventType?.includes("SPENT") ||
    event.eventType?.includes("APPROVED");
  const isAi =
    event.eventType?.includes("AI") || event.eventType?.includes("RISK");
  const isBlockchain = event.eventType?.includes("BLOCKCHAIN");
  const isProof = event.eventType?.includes("PROOF");
  const isTrust = event.eventType?.includes("TRUST");

  // Get dot color based on event type
  const getDotColor = () => {
    if (isError) return "var(--color-danger)";
    if (isFinal) return "var(--color-success)";
    if (isBlockchain) return "var(--color-verified-dark)";
    if (isAi) return "#5B3D8A";
    if (isProof) return "var(--color-verified)";
    if (isTrust) return "var(--color-caution)";
    return "var(--color-primary)";
  };

  // Check if event has expandable content
  const hasExpandableContent =
    event.metadata && Object.keys(event.metadata).length > 0;

  return (
    <div
      style={{
        position: "relative",
        marginBottom: "var(--space-6)",
      }}
    >
      {/* Timeline Dot */}
      <span
        style={{
          position: "absolute",
          left: "-31px",
          top: "2px",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          border: "2px solid white",
          background: getDotColor(),
          boxShadow: "0 0 0 2px var(--color-border)",
          flexShrink: 0,
        }}
      />

      {/* Event Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "var(--space-2)",
          cursor: hasExpandableContent ? "pointer" : "default",
        }}
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
      >
        <div
          style={{
            fontWeight: "700",
            fontSize: "13px",
            color: isError ? "var(--color-danger)" : "var(--color-text)",
            flex: 1,
          }}
        >
          {EVENT_LABELS[event.eventType] ||
            event.label ||
            event.eventType?.replaceAll("_", " ")}
          {hasExpandableContent && (
            <span
              style={{
                marginLeft: "8px",
                fontSize: "10px",
                color: "var(--color-text-faint)",
              }}
            >
              {expanded ? "▼" : "▶"}
            </span>
          )}
        </div>
        <time
          style={{
            flexShrink: 0,
            fontSize: "10px",
            fontFamily: "monospace",
            color: "var(--color-text-faint)",
            background: "var(--color-surface-alt)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          {new Date(event.timestamp).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>

      {/* Actor Information */}
      {event.actor && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-text-muted)",
            marginTop: "2px",
          }}
        >
          {event.actor.name ? (
            <>
              <strong>{event.actor.name}</strong> ({event.actor.role})
            </>
          ) : (
            <>
              Verified by: <strong>{event.actor.role}</strong>
            </>
          )}
        </div>
      )}

      {/* Event Description */}
      {event.description && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            marginTop: "4px",
            lineHeight: "1.5",
          }}
        >
          {event.description}
        </div>
      )}

      {/* Expandable Metadata Section */}
      {hasExpandableContent && expanded && (
        <div
          style={{
            marginTop: "var(--space-2)",
            background: "var(--color-ink)",
            color: "var(--color-steel-light)",
            padding: "10px 12px",
            borderRadius: "var(--radius)",
            fontSize: "10px",
            fontFamily: "monospace",
            overflow: "auto",
            border: "1px solid var(--color-ink-soft)",
            animation: "slideDown 0.2s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--color-ink-soft)",
              marginBottom: "6px",
              paddingBottom: "4px",
            }}
          >
            <span style={{ color: "var(--color-steel-light)" }}>METADATA</span>
            <span style={{ color: "var(--color-verified-light)" }}>#IMMUTABLE</span>
          </div>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Event Category Badge (optional) */}
      {event.category && (
        <div
          style={{
            marginTop: "var(--space-2)",
            display: "inline-block",
          }}
        >
          <span
            style={{
              fontSize: "9px",
              padding: "2px 6px",
              background: "var(--color-surface-alt)",
              borderRadius: "3px",
              color: "var(--color-text-faint)",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            {event.category}
          </span>
        </div>
      )}
    </div>
  );
}

TimelineItem.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string,
    eventType: PropTypes.string.isRequired,
    label: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    actor: PropTypes.shape({
      name: PropTypes.string,
      role: PropTypes.string,
    }),
    description: PropTypes.string,
    metadata: PropTypes.object,
    category: PropTypes.string,
  }).isRequired,
  index: PropTypes.number,
};

TimelineItem.defaultProps = {
  index: 0,
};
