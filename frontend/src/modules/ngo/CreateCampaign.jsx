import { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import InfoNotice from "../../components/InfoNotice";

const DISASTER_TYPES = ["FLOOD", "EARTHQUAKE", "CYCLONE", "FIRE", "DROUGHT", "OTHER"];
const CATEGORY_CHOICES = ["FOOD", "MEDICINE", "SHELTER", "WATER"];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    disasterType: "",
    targetAmount: 100000,
    location: { state: "", district: "", ward: "" },
    policySnapshot: {
      allowedCategories: ["FOOD", "MEDICINE"],
      maxPerBeneficiary: 5000,
      maxPerTransaction: 1000,
      validityDays: 30,
      cooldownDays: 0,
      minEligibilityConfidence: 0.6,
      maxFraudRisk: 0.4,
    },
  });

  const updatePolicy = (key, value) => {
    setForm({
      ...form,
      policySnapshot: {
        ...form.policySnapshot,
        [key]: value,
      },
    });
  };

  const toggleCategory = (cat) => {
    const current = form.policySnapshot.allowedCategories;
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    updatePolicy("allowedCategories", next);
  };

  const submit = async () => {
    if (!form.title || !form.disasterType) {
      setError("Title and disaster type are required.");
      return;
    }
    if (form.policySnapshot.allowedCategories.length === 0) {
      setError("Select at least one allowed spending category.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.post("/campaigns", {
        title: form.title,
        description: form.description,
        disasterType: form.disasterType,
        targetAmount: form.targetAmount || 100000,
        location: form.location,
        policy: {
          allowedCategories: form.policySnapshot.allowedCategories,
          maxPerBeneficiary: form.policySnapshot.maxPerBeneficiary,
          maxPerTransaction: form.policySnapshot.maxPerTransaction || 1000,
          validityDays: form.policySnapshot.validityDays,
          cooldownDays: form.policySnapshot.cooldownDays,
        },
      });
      navigate("/ngo");
    } catch (err) {
      setError(err.response?.data?.message || "Campaign creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack-lg animate-fade-up" style={{ maxWidth: "680px" }}>
      <div className="page-header">
        <h1 className="page-title">Launch a Campaign</h1>
        <p className="page-subtitle">
          Define the relief mission and its spending policy. Saved as a draft until you submit it for admin approval.
        </p>
      </div>

      <InfoNotice
        title="Policy governance"
        message="Once a campaign is activated, its policy rules become immutable and every transaction against them is permanently audited."
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card stack">
        <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Mission details</h3>

        <div className="form-group">
          <label className="form-label">Campaign title</label>
          <input
            className="form-input"
            placeholder="e.g. Assam Flood Relief — Phase 2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            placeholder="What happened, who is affected, and how this aid will help."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Disaster type</label>
            <select
              className="form-input"
              value={form.disasterType}
              onChange={(e) => setForm({ ...form, disasterType: e.target.value })}
            >
              <option value="">Select type</option>
              {DISASTER_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <div className="grid-3">
            <input
              className="form-input"
              placeholder="State"
              value={form.location.state}
              onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })}
            />
            <input
              className="form-input"
              placeholder="District"
              value={form.location.district}
              onChange={(e) => setForm({ ...form, location: { ...form.location, district: e.target.value } })}
            />
            <input
              className="form-input"
              placeholder="Ward"
              value={form.location.ward}
              onChange={(e) => setForm({ ...form, location: { ...form.location, ward: e.target.value } })}
            />
          </div>
        </div>
      </div>

      <div className="card stack" style={{ borderTop: "3px solid var(--color-signal)" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Spending policy — immutable once activated</h3>

        <div className="form-group">
          <label className="form-label">Allowed categories</label>
          <div className="row" style={{ gap: "8px", flexWrap: "wrap" }}>
            {CATEGORY_CHOICES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`btn btn-sm ${form.policySnapshot.allowedCategories.includes(cat) ? "btn-primary" : "btn-ghost"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Max per beneficiary (₹)</label>
            <input
              type="number"
              className="form-input"
              value={form.policySnapshot.maxPerBeneficiary}
              onChange={(e) => updatePolicy("maxPerBeneficiary", Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max per transaction (₹)</label>
            <input
              type="number"
              className="form-input"
              value={form.policySnapshot.maxPerTransaction}
              onChange={(e) => updatePolicy("maxPerTransaction", Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Wallet validity (days)</label>
            <input
              type="number"
              className="form-input"
              value={form.policySnapshot.validityDays}
              onChange={(e) => updatePolicy("validityDays", Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cooldown between spends (days)</label>
            <input
              type="number"
              className="form-input"
              value={form.policySnapshot.cooldownDays}
              onChange={(e) => updatePolicy("cooldownDays", Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Min AI eligibility confidence (0–1)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              className="form-input"
              value={form.policySnapshot.minEligibilityConfidence}
              onChange={(e) => updatePolicy("minEligibilityConfidence", Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max AI fraud risk (0–1)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              className="form-input"
              value={form.policySnapshot.maxFraudRisk}
              onChange={(e) => updatePolicy("maxFraudRisk", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button onClick={submit} disabled={submitting} className="btn btn-primary btn-lg">
          {submitting ? "Creating…" : "Create campaign (draft)"}
        </button>
      </div>
    </div>
  );
}
