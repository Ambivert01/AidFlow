import { useState } from "react";
import api from "../../services/api";

export default function AIOverride() {
  const [form, setForm] = useState({
    entityType: "DONATION",
    entityId: "",
    decisionType: "FRAUD_DETECTION",
    override: "APPROVED",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.post("/admin/ai/override", form);
      setResult(res.data?.data || res.data);
      setForm({
        entityType: "DONATION",
        entityId: "",
        decisionType: "FRAUD_DETECTION",
        override: "APPROVED",
        reason: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to override AI decision");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container animate-fade-up"
      style={{ padding: "var(--space-6)", maxWidth: "800px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: "800",
            marginBottom: "var(--space-2)",
          }}
        >
          AI Decision Override
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Override AI decisions for fraud detection, risk scoring, and other
          automated decisions
        </p>
      </div>

      {/* Warning Alert */}
      <div
        className="alert alert-warning"
        style={{ marginBottom: "var(--space-6)", fontSize: "13px" }}
      >
        <strong>⚠️ Warning:</strong> Overriding AI decisions should only be done
        after thorough investigation. All overrides are logged and audited.
      </div>

      {/* Form */}
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group">
            <label className="form-label">Entity Type</label>
            <select
              className="form-input"
              value={form.entityType}
              onChange={(e) => setForm({ ...form, entityType: e.target.value })}
              required
            >
              <option value="DONATION">Donation</option>
              <option value="FRAUD_ALERT">Fraud Alert</option>
              <option value="BENEFICIARY">Beneficiary</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Entity ID</label>
            <input
              type="text"
              className="form-input"
              value={form.entityId}
              onChange={(e) => setForm({ ...form, entityId: e.target.value })}
              placeholder="Enter entity ID (MongoDB ObjectId)"
              required
            />
            <small
              style={{
                color: "var(--color-text-muted)",
                fontSize: "12px",
                marginTop: "4px",
                display: "block",
              }}
            >
              The MongoDB ObjectId of the entity you want to override
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Decision Type</label>
            <select
              className="form-input"
              value={form.decisionType}
              onChange={(e) =>
                setForm({ ...form, decisionType: e.target.value })
              }
              required
            >
              <option value="FRAUD_DETECTION">Fraud Detection</option>
              <option value="RISK_ASSESSMENT">Risk Assessment</option>
              <option value="ELIGIBILITY_CHECK">Eligibility Check</option>
              <option value="PROOF_VERIFICATION">Proof Verification</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Override Decision</label>
            <select
              className="form-input"
              value={form.override}
              onChange={(e) => setForm({ ...form, override: e.target.value })}
              required
            >
              <option value="APPROVED">Approve (Override Rejection)</option>
              <option value="REJECTED">Reject (Override Approval)</option>
              <option value="FLAGGED">Flag for Review</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Override</label>
            <textarea
              className="form-input"
              rows="4"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Explain why you are overriding the AI decision..."
              required
            />
            <small
              style={{
                color: "var(--color-text-muted)",
                fontSize: "12px",
                marginTop: "4px",
                display: "block",
              }}
            >
              This will be logged in the audit trail
            </small>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ fontSize: "13px" }}>
              {error}
            </div>
          )}

          {result && (
            <div className="alert alert-success" style={{ fontSize: "13px" }}>
              <strong>✅ Success:</strong> {result.message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: "var(--space-2)" }}
          >
            {loading ? "Processing Override..." : "Override AI Decision"}
          </button>
        </form>
      </div>

      {/* Info Section */}
      <div
        className="card"
        style={{ padding: "var(--space-6)", marginTop: "var(--space-6)" }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "var(--space-4)",
          }}
        >
          How AI Override Works
        </h2>
        <div
          className="stack"
          style={{ fontSize: "14px", color: "var(--color-text-muted)" }}
        >
          <div>
            <strong>1. Find the Entity:</strong> Locate the entity (donation,
            fraud alert, etc.) that has an AI decision you want to override.
          </div>
          <div>
            <strong>2. Enter Details:</strong> Provide the entity type, ID, and
            the type of AI decision you're overriding.
          </div>
          <div>
            <strong>3. Choose Override:</strong> Select whether to approve,
            reject, or flag the entity.
          </div>
          <div>
            <strong>4. Document Reason:</strong> Provide a clear explanation for
            the override (required for audit trail).
          </div>
          <div>
            <strong>5. Submit:</strong> The system will update the entity and
            log the override in the audit trail.
          </div>
        </div>
      </div>

      {/* Recent Overrides */}
      <div
        className="card"
        style={{ padding: "var(--space-6)", marginTop: "var(--space-6)" }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "var(--space-4)",
          }}
        >
          Recent Overrides
        </h2>
        <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>
            📋
          </div>
          <p style={{ color: "var(--color-text-muted)" }}>
            Check the Audit Logs page to view all AI overrides
          </p>
        </div>
      </div>
    </div>
  );
}
