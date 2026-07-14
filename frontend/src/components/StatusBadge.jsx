export default function StatusBadge({ status }) {
  const styleMap = {
    APPROVED: "badge-green",
    PENDING: "badge-yellow",
    BLOCKED: "badge-red",
    ACTIVE: "badge-blue",
    EXPIRED: "badge-gray",
    REGISTERED: "badge-blue",
    MANUAL_REVIEW: "badge-yellow",
    REJECTED: "badge-red",
    READY_FOR_USE: "badge-green",
    SUSPENDED: "badge-yellow",
    AUDIT_FINALIZED: "badge-teal",
    DRAFT: "badge-gray",
    HIGH_RISK_ESCALATED: "badge-red",
  };

  return (
    <span
      className={`badge ${styleMap[status] || "badge-gray"} hover-scale`}
      style={{
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {status}
    </span>
  );
}
