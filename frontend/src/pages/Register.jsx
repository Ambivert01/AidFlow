import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/authStore";

const ROLE_COPY = {
  DONOR: {
    badge: "Donor Registration",
    heading: "Fund aid you can trace",
    subheading:
      "Every donation gets an AI risk check, a policy-locked wallet, and a blockchain-anchored proof trail you can verify yourself.",
    button: "Create Donor Account",
  },
  BENEFICIARY: {
    badge: "Aid Seeker Registration",
    heading: "Apply to receive aid",
    subheading:
      "Create your account to apply to an active relief campaign. Your application goes through an AI eligibility check and NGO review before a wallet is issued to you.",
    button: "Create My Account",
  },
};

export default function Register() {
  const [role, setRole] = useState("DONOR");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { ...formData, role };
      if (role === "DONOR") delete payload.phone; // keep donor payload unchanged
      if (!payload.phone) delete payload.phone;
      await api.post("/auth/register", payload);

      // Auto-login after successful registration
      await login({ email: formData.email, password: formData.password });

      // Router will catch the state and redirect to /donor or /beneficiary automatically
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Email may already be in use.",
      );
      setLoading(false);
    }
  };

  const copy = ROLE_COPY[role];

  return (
    <div className="center-page animate-fade-up" style={{ padding: "var(--space-6)" }}>
      <div
        className="card shadow-lg hover-lift"
        style={{ maxWidth: "460px", width: "100%", padding: "var(--space-8)", transition: "all 0.3s ease" }}
      >
        <div
          role="tablist"
          aria-label="Registration type"
          style={{
            display: "flex",
            background: "var(--color-surface-alt)",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "var(--space-6)",
            gap: "4px",
          }}
        >
          {["DONOR", "BENEFICIARY"].map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={role === r ? "btn btn-primary" : "btn btn-ghost"}
              style={{
                flex: 1,
                fontSize: "13px",
                padding: "8px 10px",
                transition: "all 0.2s ease",
              }}
            >
              {r === "DONOR" ? "I want to donate" : "I need aid"}
            </button>
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <div
            style={{
              display: "inline-flex",
              background: "var(--color-primary-light)",
              color: "var(--color-primary-dark)",
              padding: "4px 12px",
              borderRadius: "100px",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "var(--space-4)",
            }}
          >
            {copy.badge}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "26px",
              fontWeight: "700",
              color: "var(--color-text)",
              marginBottom: "var(--space-2)",
            }}
          >
            {copy.heading}
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {copy.subheading}
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
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
            />
          </div>

          {role === "BENEFICIARY" && (
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                title="Exactly 10 digits"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Create Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
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

          <div
            className="alert alert-info"
            style={{ fontSize: "12px", marginTop: "var(--space-2)" }}
          >
            By registering, you agree to our Terms of Service and Privacy
            Policy. AidFlow utilizes public blockchain ledgers for donor
            transparency.
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{
              marginTop: "var(--space-2)",
              boxShadow: "0 4px 14px 0 rgba(232, 83, 11, 0.3)",
            }}
          >
            {loading ? "Creating Account..." : copy.button}
          </button>
        </form>

        <div
          style={{
            marginTop: "var(--space-6)",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>
            Already have an account?{" "}
          </span>
          <Link
            to="/login"
            style={{
              fontWeight: "600",
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
        </div>

        <div
          style={{
            marginTop: "var(--space-6)",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--color-border)",
            textAlign: "center",
            fontSize: "12px",
          }}
        >
          <p style={{ color: "var(--color-text-faint)" }}>
            Are you an NGO, Merchant, or Government Authority?
            <br />
            <Link
              to="/request-access"
              style={{
                fontWeight: "600",
                color: "var(--color-text-muted)",
                textDecoration: "underline",
              }}
            >
              Apply for network access here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
