import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";

const EVENT_LABELS = {
  DONATION_CREATED: "Donation Received",
  BENEFICIARY_AI_EVALUATED: "AI Evaluated Beneficiary",
  DONATION_BENEFICIARY_ASSIGNED: "NGO Assigned Beneficiary",
  DONATION_APPROVED_BY_NGO: "NGO Approved — Wallet Created",
  DONATION_REJECTED_BY_NGO: "NGO Rejected Donation",
  WALLET_CREATED: "Aid Wallet Activated",
  WALLET_SPENT: "Aid Spent by Beneficiary",
  DONATION_APPROVED_BY_GOVT: "Government Cleared",
  DONATION_REJECTED_BY_GOVT: "Government Rejected",
  WORKFLOW_AUDIT_FINALIZED: "✅ Audit Finalized & Blockchain Anchored",
  MERCHANT_CATEGORY_VIOLATION: "⚠️ Category Violation Detected",
};

export default function DonationTimeline() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/donor/donations/${id}`)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load donation detail."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="stack-lg" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: "40%" }} />
        </div>
        <div className="card skeleton" style={{ height: "400px" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="stack-lg" style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/donor" className="btn btn-ghost">← Back to Dashboard</Link>
      </div>
    );
  }

  const { donation, audit } = data || {};

  return (
    <div className="stack-lg" style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div className="page-header">
        <Link to="/donor" className="btn btn-ghost btn-sm" style={{ marginBottom: "var(--space-2)", width: "fit-content" }}>← Back</Link>
        <h1 className="page-title">Donation Timeline</h1>
        <p className="page-subtitle">End-to-end audit trail for your donation — cryptographically immutable.</p>
      </div>

      {/* Donation Summary Card */}
      {donation && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <div className="grid-2" style={{ gap: "var(--space-4)" }}>
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--color-text-faint)", marginBottom: "4px" }}>Campaign</div>
              <div style={{ fontWeight: "700" }}>{donation.campaign?.title || "—"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{donation.campaign?.disasterType} · {donation.campaign?.location?.state}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--color-text-faint)", marginBottom: "4px" }}>Amount</div>
              <div style={{ fontWeight: "800", fontSize: "22px", color: "var(--color-primary-dark)" }}>₹{donation.amount?.toLocaleString("en-IN")}</div>
            </div>
          </div>

          {/* Beneficiary */}
          {donation.beneficiary && (
            <div style={{ marginTop: "var(--space-3)", padding: "10px 12px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)", fontSize: "12px" }}>
              <strong>Beneficiary:</strong> {donation.beneficiary?.name} — Status: {donation.beneficiary?.status}
            </div>
          )}

          {/* Audit anchor */}
          {audit?.finalized && (
            <div style={{ marginTop: "var(--space-3)", padding: "10px 12px", background: "rgba(34,197,94,0.08)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--color-success)", fontSize: "12px" }}>
              <div style={{ fontWeight: "700", color: "var(--color-success)" }}>✓ Blockchain Anchored</div>
              <div style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                Merkle Root: {audit.merkleRoot}
              </div>
              {audit.blockchainTxHash && (
                <div style={{ fontFamily: "monospace", fontSize: "10px", color: "var(--color-text-muted)" }}>
                  Tx Hash: {audit.blockchainTxHash}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h2 style={{ fontWeight: "700", fontSize: "15px", marginBottom: "var(--space-6)" }}>Event Timeline</h2>
        {(!audit?.timeline || audit.timeline.length === 0) ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No events recorded yet</div>
            <div className="empty-state-desc">Audit logs will appear here as your donation progresses.</div>
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: "24px", borderLeft: "2px solid var(--color-border)" }}>
            {audit.timeline.map((e, i) => {
              const isError = e.event.includes("REJECT") || e.event.includes("FAIL") || e.event.includes("VIOLATION");
              const isFinal = e.event.includes("FINALIZED") || e.event.includes("SPENT") || e.event.includes("APPROVED");
              const isAi = e.event.includes("AI") || e.event.includes("RISK");

              return (
                <div key={i} style={{ position: "relative", marginBottom: "var(--space-6)" }}>
                  {/* Dot */}
                  <span style={{
                    position: "absolute",
                    left: "-31px",
                    top: "2px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: "2px solid white",
                    background: isError ? "var(--color-danger)" : isFinal ? "var(--color-success)" : isAi ? "#a855f7" : "var(--color-primary)",
                    boxShadow: "0 0 0 2px var(--color-border)",
                    flexShrink: 0,
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: isError ? "var(--color-danger)" : "var(--color-text)" }}>
                      {EVENT_LABELS[e.event] || e.label || e.event.replaceAll("_", " ")}
                    </div>
                    <time style={{ flexShrink: 0, fontSize: "10px", fontFamily: "monospace", color: "var(--color-text-faint)", background: "var(--color-surface-alt)", padding: "2px 6px", borderRadius: "4px" }}>
                      {new Date(e.timestamp).toLocaleString("en-IN")}
                    </time>
                  </div>

                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    Verified by: <strong>{e.actor}</strong>
                  </div>

                  {e.payload && (
                    <div style={{ marginTop: "var(--space-2)", background: "#0f172a", color: "#94a3b8", padding: "10px 12px", borderRadius: "var(--radius)", fontSize: "10px", fontFamily: "monospace", overflow: "auto", border: "1px solid #1e293b" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", marginBottom: "6px", paddingBottom: "4px" }}>
                        <span style={{ color: "#475569" }}>PAYLOAD</span>
                        <span style={{ color: "#60a5fa" }}>#IMMUTABLE</span>
                      </div>
                      {JSON.stringify(e.payload, null, 2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <a href={`/public-audit?job=${id}`} className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }}>
          🔍 Verify on Public Audit Portal →
        </a>
      </div>
    </div>
  );
}
