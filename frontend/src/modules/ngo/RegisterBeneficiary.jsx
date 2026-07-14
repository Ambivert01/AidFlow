import { useEffect, useState } from "react";
import api from "../../services/api";
import InfoNotice from "../../components/InfoNotice";
import Loader from "../../components/Loader";

const DISPLACEMENT_OPTIONS = ["UNKNOWN", "STABLE", "PARTIAL", "DISPLACED"];
const INCOME_OPTIONS = ["UNKNOWN", "NONE", "LOW", "MEDIUM"];

export default function RegisterBeneficiary() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    aadhaar: "",
    campaignId: "",
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

  // Load NGO campaigns
  useEffect(() => {
    api.get("/ngo/campaigns")
      .then(res => setCampaigns(res.data?.data || res.data || []))
      .catch(() => setCampaigns([]));
  }, []);

  const updateHousehold = (key, value) => {
    setForm({ ...form, household: { ...form.household, [key]: value } });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");

    try {
      await api.post("/beneficiaries", {
        name: form.name,
        campaignId: form.campaignId,
        phone: form.phone,
        // Aadhaar is genuinely optional in the backend schema - omit
        // entirely rather than send an empty string, which would fail the
        // 12-digit regex validator.
        ...(form.aadhaar ? { aadhaar: form.aadhaar } : {}),
        location: {
          state: form.location.state,
          district: form.location.district,
          ward: form.location.ward,
        },
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

      setMsg("Beneficiary registered and sent for AI evaluation.");
      setForm({
        name: "",
        phone: "",
        aadhaar: "",
        campaignId: form.campaignId,
        location: form.location,
        household: { familySize: 1, dependents: 0, elderlyCount: 0, childrenCount: 0, disabledMembers: 0 },
        displacementStatus: "UNKNOWN",
        incomeLevel: "UNKNOWN",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Check that all required fields are filled correctly.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Registering beneficiary..." />;

  return (
    <div className="stack-lg animate-fade-up" style={{ maxWidth: "640px" }}>
      <div className="page-header">
        <h1 className="page-title">Register Beneficiary</h1>
        <p className="page-subtitle">Submit a person for AI eligibility evaluation against an active campaign.</p>
      </div>

      <InfoNotice
        title="Governance notice"
        message="Beneficiary data is evaluated by AI and permanently audited. Aadhaar is hashed and never stored in plaintext."
      />

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={submit} className="card stack">
        <div className="form-group">
          <label className="form-label">Beneficiary name</label>
          <input
            className="form-input"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="grid-2">
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
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Campaign</label>
          <select
            className="form-input"
            value={form.campaignId}
            onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
            required
          >
            <option value="">Select campaign</option>
            {campaigns.map(c => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
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
              {DISPLACEMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Income level</label>
            <select
              className="form-input"
              value={form.incomeLevel}
              onChange={(e) => setForm({ ...form, incomeLevel: e.target.value })}
            >
              {INCOME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
          {loading ? "Submitting…" : "Register beneficiary"}
        </button>
      </form>
    </div>
  );
}
