import { useEffect, useState } from "react";
import * as benSvc from "../../services/beneficiary.service";
import useAuthStore from "../../store/authStore";

const DISPLACEMENT_OPTIONS = ["UNKNOWN", "STABLE", "PARTIAL", "DISPLACED"];
const INCOME_OPTIONS = ["UNKNOWN", "NONE", "LOW", "MEDIUM"];

export default function BeneficiarySelfApply() {
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [existingRecord, setExistingRecord] = useState(null);

  const [form, setForm] = useState({
    campaignId: "",
    name: user?.name || "",
    phone: user?.phone || "",
    aadhaar: "",
    location: { state: "", district: "", ward: "" },
    household: {
      familySize: 1,
      dependents: 0,
      elderlyCount: 0,
      childrenCount: 0,
      disabledMembers: 0,
    },
    displacementStatus: "UNKNOWN",
    incomeLevel: "UNKNOWN",
  });

  useEffect(() => {
    const init = async () => {
      try {
        // getMyBeneficiary 404s until an application exists - that's expected
        // for a first-time applicant, so we swallow that specific case.
        const [campRes, meRes] = await Promise.all([
          benSvc.getActiveCampaigns(),
          benSvc.getMyBeneficiary().catch(() => ({ data: null })),
        ]);
        setCampaigns(campRes.data?.data || campRes.data || []);
        setExistingRecord(meRes.data?.data || meRes.data || null);
      } catch (err) {
        console.error("BeneficiarySelfApply init error", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const updateHousehold = (key, value) => {
    setForm((f) => ({ ...f, household: { ...f.household, [key]: value } }));
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!form.campaignId) {
      setMsg({ type: "danger", text: "Please select a campaign." });
      return;
    }

    setSubmitting(true);
    try {
      await benSvc.applyToCampaign({
        campaignId: form.campaignId,
        name: form.name,
        phone: form.phone,
        // Aadhaar is genuinely optional - omit rather than send an empty
        // string, which would fail the 12-digit backend validator.
        ...(form.aadhaar ? { aadhaar: form.aadhaar } : {}),
        location: form.location,
        household: {
          familySize: Number(form.household.familySize),
          dependents: Number(form.household.dependents),
          elderlyCount: Number(form.household.elderlyCount),
          childrenCount: Number(form.household.childrenCount),
          disabledMembers: Number(form.household.disabledMembers),
        },
        displacementStatus: form.displacementStatus,
        incomeLevel: form.incomeLevel,
      });
      setMsg({
        type: "success",
        text: "Application submitted! An AI eligibility check runs first, then the managing NGO makes the final call. You'll see your status update here.",
      });
      const meRes = await benSvc.getMyBeneficiary().catch(() => ({ data: null }));
      setExistingRecord(meRes.data?.data || meRes.data || null);
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.message || "Application failed. You may have already applied to this campaign.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
    PENDING: "Application Submitted — Awaiting Review",
    UNDER_REVIEW: "AI Evaluation Complete — Awaiting NGO Confirmation",
    APPROVED: "Approved — Wallet Being Created",
    REJECTED: "Application Rejected by NGO",
    MANUAL_REVIEW: "Under Manual Review by NGO",
    BLOCKED: "Application Blocked by AI",
    ACTIVE: "Approved & Active — Wallet Ready",
    // Legacy statuses (kept for backward compatibility with older records)
    REGISTERED: "Application Submitted — Awaiting Review",
    AI_EVALUATED: "AI Evaluation Completed",
    ELIGIBLE: "AI Marked Eligible — Awaiting NGO Confirmation",
    NGO_APPROVED: "Approved — Wallet Being Created",
    NGO_REJECTED: "Application Rejected by NGO",
  };

  const REJECTED_STATUSES = ["REJECTED", "NGO_REJECTED", "BLOCKED"];
  const canApply = !existingRecord || REJECTED_STATUSES.includes(existingRecord.status);

  return (
    <div className="stack-lg animate-fade-up" style={{ maxWidth: "640px", margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Apply for Aid</h1>
        <p className="page-subtitle">
          Tell us about your household and select an active relief campaign. Your eligibility is evaluated by AI, then confirmed by the managing NGO.
        </p>
      </div>

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
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color:
                    existingRecord.status === "ACTIVE" || existingRecord.status === "APPROVED"
                      ? "var(--color-success)"
                      : REJECTED_STATUSES.includes(existingRecord.status)
                      ? "var(--color-danger)"
                      : "var(--color-text)",
                }}
              >
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

      {canApply && (
        <form onSubmit={handleApply} className="card stack">
          <h2 style={{ fontWeight: "700", fontSize: "16px" }}>
            {existingRecord ? "Apply to a New Campaign" : "Submit Application"}
          </h2>

          <div className="form-group">
            <label className="form-label">Select active campaign</label>
            <select
              className="form-input"
              value={form.campaignId}
              onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
              required
            >
              <option value="">— Choose a campaign —</option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.disasterType} · {c.location?.state || "India"})
                </option>
              ))}
            </select>
            {campaigns.length === 0 && (
              <div className="form-hint">No active campaigns available right now. Check back later.</div>
            )}
          </div>

          {form.campaignId &&
            (() => {
              const c = campaigns.find((x) => x._id === form.campaignId);
              return c ? (
                <div style={{ padding: "12px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)", fontSize: "12px" }}>
                  <div><strong>Aid policy:</strong> {c.policySnapshot?.allowedCategories?.join(", ")}</div>
                  <div><strong>Cap per person:</strong> ₹{c.policySnapshot?.maxPerBeneficiary?.toLocaleString("en-IN")}</div>
                  <div><strong>Validity:</strong> {c.policySnapshot?.validityDays} days</div>
                </div>
              ) : null;
            })()}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone number</label>
              <input
                className="form-input"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                pattern="[0-9]{10}"
                title="Exactly 10 digits"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Aadhaar number (optional)</label>
            <input
              className="form-input"
              placeholder="12-digit Aadhaar"
              value={form.aadhaar}
              onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
              pattern="[0-9]{12}"
              title="Exactly 12 digits, or leave blank"
            />
            <div className="form-hint">Hashed before storage - never saved in plaintext.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Your location</label>
            <div className="grid-3">
              <input
                className="form-input"
                placeholder="State"
                value={form.location.state}
                onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })}
                required
              />
              <input
                className="form-input"
                placeholder="District"
                value={form.location.district}
                onChange={(e) => setForm({ ...form, location: { ...form.location, district: e.target.value } })}
                required
              />
              <input
                className="form-input"
                placeholder="Ward"
                value={form.location.ward}
                onChange={(e) => setForm({ ...form, location: { ...form.location, ward: e.target.value } })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Household composition</label>
            <div className="grid-3" style={{ gap: "8px" }}>
              <div>
                <label className="form-hint">Family size</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={form.household.familySize}
                  onChange={(e) => updateHousehold("familySize", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-hint">Dependents</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.household.dependents}
                  onChange={(e) => updateHousehold("dependents", e.target.value)}
                />
              </div>
              <div>
                <label className="form-hint">Elderly</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.household.elderlyCount}
                  onChange={(e) => updateHousehold("elderlyCount", e.target.value)}
                />
              </div>
              <div>
                <label className="form-hint">Children</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.household.childrenCount}
                  onChange={(e) => updateHousehold("childrenCount", e.target.value)}
                />
              </div>
              <div>
                <label className="form-hint">Disabled members</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.household.disabledMembers}
                  onChange={(e) => updateHousehold("disabledMembers", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Displacement status</label>
              <select
                className="form-input"
                value={form.displacementStatus}
                onChange={(e) => setForm({ ...form, displacementStatus: e.target.value })}
              >
                {DISPLACEMENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Income level</label>
              <select
                className="form-input"
                value={form.incomeLevel}
                onChange={(e) => setForm({ ...form, incomeLevel: e.target.value })}
              >
                {INCOME_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="alert alert-info">
            After submission, an AI model evaluates your eligibility based on your location and need signals. The managing NGO makes the final decision.
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={submitting || campaigns.length === 0}>
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      )}
    </div>
  );
}
