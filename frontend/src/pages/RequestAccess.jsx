import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function RequestAccess() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "NGO",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the open end-point to list in the pending PENDING state
      await api.post("/access/request", formData);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Application failed. Email may already be in use.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="center-page animate-fade-up"
        style={{ padding: "var(--space-6)", textAlign: "center" }}
      >
        <div
          className="card shadow-lg stack-lg hover-lift"
          style={{
            maxWidth: "460px",
            width: "100%",
            padding: "var(--space-8)",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ fontSize: "64px", margin: "0 auto" }}>📨</div>
          <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
            Application Received
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            Your request to join AidFlow as a <strong>{formData.role}</strong>{" "}
            has been secured in our queue.
          </p>
          <div
            className="alert alert-info"
            style={{ textAlign: "left", fontSize: "13px" }}
          >
            <strong>KYC Review Process:</strong> A system administrator will
            review your organization details shortly. You will receive an email
            once your account has been approved and moved to ACTIVE status.
          </div>
          <Link to="/" className="btn btn-ghost mt-4">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page animate-fade-up" style={{ padding: "var(--space-6)" }}>
      <div
        className="card shadow-lg hover-lift"
        style={{ maxWidth: "500px", width: "100%", padding: "var(--space-8)", transition: "all 0.3s ease" }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: "800",
              color: "var(--color-text)",
              marginBottom: "var(--space-2)",
            }}
          >
            Partner Application
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            NGOs, Merchants, and Government Authorities must undergo KYC review
            before accessing the AidFlow platform. Apply below.
          </p>
        </div>

        {error && (
          <div
            className="alert alert-danger"
            style={{ marginBottom: "var(--space-4)" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          {/* Role selector buttons instead of a dropdown for better UX */}
          <div className="form-group">
            <label className="form-label">Organization Profile Type</label>
            <div className="grid-3" style={{ gap: "8px" }}>
              {[
                { value: "NGO", label: "NGO", icon: "🤝" },
                { value: "MERCHANT", label: "Merchant", icon: "🏪" },
                { value: "GOVERNMENT", label: "Government", icon: "🏛️" },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: r.value }))
                  }
                  className={`btn ${formData.role === r.value ? "btn-primary" : "btn-ghost"}`}
                  style={{
                    padding: "12px 8px",
                    flexDirection: "column",
                    height: "auto",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{r.icon}</span>
                  <span style={{ fontSize: "11px" }}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Organization / Representative Name
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder={
                formData.role === "MERCHANT"
                  ? "Shop Name / Rep Name"
                  : `${formData.role} Title`
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@organization.org"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              minLength="6"
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$"
              title="Password must contain at least one uppercase letter, one lowercase letter, and one number"
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
              Must include: uppercase, lowercase, and number
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: "var(--space-4)" }}
          >
            {loading ? "Submitting Application..." : "Submit Access Request"}
          </button>
        </form>

        <div
          style={{
            marginTop: "var(--space-6)",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          <Link to="/login" className="btn btn-ghost btn-sm">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
