import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login({ email, password });

    // AuthStore handles state. On success, App.jsx router will unrender login
    // and route to the correct role dashboard automatically based on user.role
  };

  return (
    <div className="center-page animate-fade-up" style={{ padding: "var(--space-6)" }}>
      <div
        className="card shadow-lg hover-lift"
        style={{ maxWidth: "400px", width: "100%", padding: "var(--space-8)", transition: "all 0.3s ease" }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "30px",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
              marginBottom: "var(--space-2)",
            }}
          >
            AidFlow
            <span
              style={{
                color: "var(--color-primary)",
                fontSize: "40px",
                lineHeight: 0,
              }}
            >
              .
            </span>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Sign in to your dashboard to manage, disburse, or receive
            transparent humanitarian aid.
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
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.org"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div style={{ marginTop: "var(--space-2)", textAlign: "right" }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "13px",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                Forgot Password?
              </Link>
            </div>
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
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-6)",
            borderTop: "1px solid var(--color-border)",
            textAlign: "center",
            fontSize: "13px",
          }}
        >
          <p
            style={{
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-4)",
            }}
          >
            Don't have an account?
          </p>
          <div
            className="row"
            style={{ justifyContent: "center", gap: "var(--space-2)" }}
          >
            <Link
              to="/register"
              className="btn btn-ghost btn-sm"
              style={{ fontWeight: "600", color: "var(--color-primary-dark)" }}
            >
              Donor / Aid Seeker
            </Link>
            <span style={{ color: "var(--color-border-strong)" }}>|</span>
            <Link
              to="/request-access"
              className="btn btn-ghost btn-sm"
              style={{ fontWeight: "600", color: "var(--color-secondary)" }}
            >
              Partners (NGO/Merchant)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
