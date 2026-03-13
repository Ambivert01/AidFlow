import { useEffect, useState } from "react";
import api from "../../services/api";
import * as benSvc from "../../services/beneficiary.service";

export default function BeneficiarySelfApply() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [existingRecord, setExistingRecord] = useState(null);
  const [checkingRecord, setCheckingRecord] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if already applied/registered
        const [campRes, meRes] = await Promise.all([
          benSvc.getActiveCampaigns(),
          benSvc.getMyBeneficiary().catch(() => ({ data: null })),
        ]);
        setCampaigns(campRes.data || []);
        setExistingRecord(meRes.data);
      } catch (err) {
        console.error("BeneficiarySelfApply init error", err);
      } finally {
        setLoading(false);
        setCheckingRecord(false);
      }
    };
    init();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) {
      setMsg({ type: "danger", text: "Please select a campaign." });
      return;
    }
    setSubmitting(true);
    setMsg({ type: "", text: "" });
    try {
      await benSvc.applyToCampaign(selectedCampaign);
      setMsg({ type: "success", text: "Application submitted! An NGO will review your eligibility. You will be notified once approved." });
      // Refresh existing record
      const meRes = await benSvc.getMyBeneficiary().catch(() => ({ data: null }));
      setExistingRecord(meRes.data);
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.message || "Application failed. You may have already applied." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingRecord) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: "40%" }} />
        </div>
        <div className="card skeleton" style={{ height: "300px" }} />
      </div>
    );
  }

  const STATUS_LABELS = {
    REGISTERED: "Application Submitted — Awaiting Review",
    AI_EVALUATED: "AI Evaluation Completed",
    ELIGIBLE: "AI Marked Eligible — Awaiting NGO Confirmation",
    BLOCKED: "Application Blocked by AI",
    MANUAL_REVIEW: "Under Manual Review by NGO",
    NGO_APPROVED: "Approved — Wallet Being Created",
    NGO_REJECTED: "Application Rejected by NGO",
    ACTIVE: "✅ Approved & Active — Wallet Ready",
  };

  return (
    <div className="stack-lg" style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Apply for Aid</h1>
        <p className="page-subtitle">
          Select an active disaster relief campaign to apply as a beneficiary. Your eligibility will be reviewed by AI and then confirmed by the NGO.
        </p>
      </div>

      {/* Show existing application status */}
      {existingRecord && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <h3 style={{ fontWeight: "700", fontSize: "15px", marginBottom: "var(--space-2)" }}>Your Current Application</h3>
          <div className="stack-xs">
            <div className="row-between">
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Campaign:</span>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>{existingRecord.campaign?.title || "—"}</span>
            </div>
            <div className="row-between">
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Status:</span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: existingRecord.status === "ACTIVE" ? "var(--color-success)" : existingRecord.status === "BLOCKED" || existingRecord.status === "NGO_REJECTED" ? "var(--color-danger)" : "var(--color-text)" }}>
                {STATUS_LABELS[existingRecord.status] || existingRecord.status}
              </span>
            </div>
            {existingRecord.aiDecision?.reason && (
              <div style={{ fontSize: "12px", padding: "8px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)", marginTop: "4px" }}>
                AI Note: {existingRecord.aiDecision.reason}
              </div>
            )}
            {existingRecord.overrideByNgo?.reason && (
              <div style={{ fontSize: "12px", padding: "8px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)", marginTop: "4px" }}>
                NGO Note: {existingRecord.overrideByNgo.reason}
              </div>
            )}
          </div>
        </div>
      )}

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Application Form — only if not already active or blocked */}
      {(!existingRecord || ["BLOCKED", "NGO_REJECTED"].includes(existingRecord.status)) && (
        <div className="card">
          <h2 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "var(--space-4)" }}>
            {existingRecord ? "Apply to a New Campaign" : "Submit Application"}
          </h2>

          <form onSubmit={handleApply} className="stack">
            <div className="form-group">
              <label className="form-label">Select Active Campaign</label>
              <select
                className="form-input"
                value={selectedCampaign}
                onChange={e => setSelectedCampaign(e.target.value)}
                required
              >
                <option value="">— Choose a campaign —</option>
                {campaigns.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.disasterType} · {c.location?.state || "India"})
                  </option>
                ))}
              </select>
              {campaigns.length === 0 && (
                <div className="form-hint">No active campaigns available right now. Check back later.</div>
              )}
            </div>

            {selectedCampaign && (() => {
              const c = campaigns.find(x => x._id === selectedCampaign);
              return c ? (
                <div style={{ padding: "12px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)", fontSize: "12px" }}>
                  <div><strong>Aid Policy:</strong> {c.policySnapshot?.allowedCategories?.join(", ")}</div>
                  <div><strong>Cap per person:</strong> ₹{c.policySnapshot?.maxPerBeneficiary?.toLocaleString("en-IN")}</div>
                  <div><strong>Validity:</strong> {c.policySnapshot?.validityDays} days</div>
                </div>
              ) : null;
            })()}

            <div className="alert alert-info">
              ℹ️ After submission, an AI model will evaluate your eligibility based on location and need signals. The managing NGO will make the final decision.
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || campaigns.length === 0}>
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
