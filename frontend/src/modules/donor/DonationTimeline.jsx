import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";

const EVENT_LABELS = {
  DONATION_CREATED: "Donation Received",
  DONATION_INITIATED: "Donation Initiated",
  AI_DECISION: "AI Risk Evaluation Complete",
  BENEFICIARY_ASSIGNED: "Beneficiary Assigned",
  DONATION_APPROVED_BY_NGO: "NGO Approved",
  DONATION_REJECTED_BY_NGO: "NGO Rejected",
  WALLET_CREATED: "Aid Wallet Activated",
  WALLET_SPENT: "Aid Spent by Beneficiary",
  DONATION_APPROVED_BY_GOVT: "Government Cleared",
  DONATION_REJECTED_BY_GOVT: "Government Rejected",
  PROOF_UPLOADED: "Proof Uploaded",
  PROOF_VERIFIED: "Proof Verified",
  BLOCKCHAIN_ANCHORED: "⛓️ Blockchain Anchored",
  WORKFLOW_AUDIT_FINALIZED: "✅ Audit Finalized",
};

const STATUS_LABELS = {
  INITIATED: "Initiated",
  PROCESSING: "Processing",
  PENDING_NGO_REVIEW: "Pending NGO Review",
  NGO_APPROVED: "NGO Approved",
  APPROVED_BY_GOVT: "Government Approved",
  REJECTED: "Rejected",
  READY_FOR_USE: "Ready for Use",
  FAILED: "Failed",
};

export default function DonationTimeline() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const donationRes = await api.get(`/donations/${id}`, {
          signal: controller.signal,
        });
        const donationData = donationRes.data?.data || donationRes.data;

        const timelineRes = await api.get(
          `/donations/${id}/timeline?pageSize=100`,
          {
            signal: controller.signal,
            timeout: 10000,
          },
        );
        const timelineData = timelineRes.data?.data || timelineRes.data;

        if (isMounted) {
          setData({ donation: donationData });
          setTimeline(timelineData.events || []);
        }
      } catch (err) {
        if (isMounted && err.name !== "CanceledError") {
          console.error("Error fetching donation timeline:", err);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Could not load donation timeline.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="stack-lg" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="page-header">
          <div className="skeleton skeleton-title" />
        </div>
        <div className="card skeleton" style={{ height: "400px" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="stack-lg" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/donor" className="btn btn-ghost">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { donation } = data || {};

  if (!donation) {
    return (
      <div className="stack-lg" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="alert alert-warning">Donation not found</div>
        <Link to="/donor" className="btn btn-ghost">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="stack-lg" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="page-header">
        <Link
          to="/donor"
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: "var(--space-2)", width: "fit-content" }}
        >
          ← Back
        </Link>
        <h1 className="page-title">Donation Timeline</h1>
        <p className="page-subtitle">
          End-to-end audit trail for your donation
        </p>
      </div>

      {/* Donation Summary Card */}
      <div
        className="card"
        style={{ borderLeft: "4px solid var(--color-primary)" }}
      >
        <div className="grid-2" style={{ gap: "var(--space-4)" }}>
          <div>
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                color: "var(--color-text-faint)",
                marginBottom: "4px",
              }}
            >
              Campaign
            </div>
            <div style={{ fontWeight: "700" }}>
              {donation.campaign?.title || "—"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              {donation.campaign?.disasterType}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                color: "var(--color-text-faint)",
                marginBottom: "4px",
              }}
            >
              Amount
            </div>
            <div
              style={{
                fontWeight: "800",
                fontSize: "22px",
                color: "var(--color-primary-dark)",
              }}
            >
              ₹{donation.amount?.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginTop: "var(--space-3)" }}>
          <span className="badge badge-primary">
            {STATUS_LABELS[donation.status] || donation.status}
          </span>
        </div>
      </div>

      {/* Blockchain Verification */}
      {donation.blockchainAnchored && donation.blockchainHash ? (
        <div className="card animate-scale-in" style={{ background: "var(--color-verified-light, #E9F4F1)", border: "1px solid var(--color-verified, #0E6E66)" }}>
          <div className="row-between" style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div>
              <span className="stamp">✓ Verified on-chain</span>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "10px", marginBottom: "4px" }}>
                This donation's audit trail is anchored to the blockchain. Anyone can independently confirm this hash was recorded - not just trust our word for it.
              </p>
              <code style={{ fontSize: "11px", fontFamily: "var(--font-mono)", wordBreak: "break-all", color: "var(--color-text)" }}>
                {donation.blockchainHash}
              </code>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <span className="badge badge-gray">○ Blockchain anchor pending</span>
          <p style={{ fontSize: "11px", color: "var(--color-text-faint)", marginTop: "6px" }}>
            This donation hasn't been anchored to the blockchain yet - it happens automatically once the AI risk check completes.
          </p>
        </div>
      )}

      {/* Timeline Events */}
      <div className="card">
        <h2
          style={{
            fontWeight: "700",
            fontSize: "15px",
            marginBottom: "var(--space-4)",
          }}
        >
          Event Timeline
        </h2>

        {timeline.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No events recorded yet</div>
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              paddingLeft: "24px",
              borderLeft: "2px solid var(--color-border)",
            }}
          >
            {timeline.map((e, i) => {
              const isError =
                e.eventType?.includes("REJECT") ||
                e.eventType?.includes("FAIL");
              const isFinal =
                e.eventType?.includes("FINALIZED") ||
                e.eventType?.includes("APPROVED");
              const isAnchorMoment =
                e.eventType === "BLOCKCHAIN_ANCHORED" ||
                e.eventType === "WORKFLOW_AUDIT_FINALIZED";

              return (
                <div
                  key={e._id || i}
                  className="animate-fade-up"
                  style={{
                    position: "relative",
                    marginBottom: "var(--space-6)",
                    animationDelay: `${Math.min(i, 10) * 60}ms`,
                    animationFillMode: "both",
                  }}
                >
                  {/* Dot */}
                  <span
                    style={{
                      position: "absolute",
                      left: "-31px",
                      top: "2px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: "2px solid white",
                      background: isError
                        ? "var(--color-danger)"
                        : isFinal
                          ? "var(--color-success)"
                          : "var(--color-primary)",
                      boxShadow: isAnchorMoment
                        ? "0 0 0 3px var(--color-verified-light, #E9F4F1), 0 0 0 5px var(--color-verified, #0E6E66)"
                        : "0 0 0 2px var(--color-border)",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "var(--space-2)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        color: isError
                          ? "var(--color-danger)"
                          : isAnchorMoment
                            ? "var(--color-verified, #0E6E66)"
                            : "var(--color-text)",
                      }}
                    >
                      {isAnchorMoment && (
                        <span className="stamp" style={{ fontSize: "9px", marginRight: "8px", verticalAlign: "middle" }}>
                          Sealed
                        </span>
                      )}
                      {EVENT_LABELS[e.eventType] ||
                        e.eventType?.replaceAll("_", " ")}
                    </div>
                    <time
                      style={{
                        flexShrink: 0,
                        fontSize: "10px",
                        fontFamily: "monospace",
                        color: "var(--color-text-faint)",
                      }}
                    >
                      {new Date(e.timestamp).toLocaleString("en-IN")}
                    </time>
                  </div>

                  {e.actor && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      By: <strong>{e.actor.role}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
