import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="center-page"
        style={{ padding: "var(--space-6)", textAlign: "center" }}
      >
        <div
          className="card shadow-lg stack-lg"
          style={{
            maxWidth: "460px",
            width: "100%",
            padding: "var(--space-8)",
          }}
        >
          <div style={{ fontSize: "64px", margin: "0 auto" }}>📧</div>
          <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
            Check Your Email
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            If an account exists with <strong>{email}</strong>, you will receive
            a password reset link shortly.
          </p>
          <div
            className="alert alert-info"
            style={{ textAlign: "left", fontSize: "13px" }}
          >
            <strong>Note:</strong> The reset link will expire in 1 hour. If you
            don't receive an email, check your spam folder or try again.
          </div>
          <Link to="/login" className="btn btn-primary mt-4">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page" style={{ padding: "var(--space-6)" }}>
      <div
        className="card shadow-lg"
        style={{ maxWidth: "400px", width: "100%", padding: "var(--space-8)" }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "var(--color-text)",
              marginBottom: "var(--space-2)",
            }}
          >
            Forgot Password?
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            Enter your email address and we'll send you a link to reset your
            password.
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

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{
              marginTop: "var(--space-2)",
              boxShadow: "0 4px 14px 0 rgba(14,165,233, 0.39)",
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div
          style={{
            marginTop: "var(--space-6)",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          <Link
            to="/login"
            style={{
              fontWeight: "600",
              color: "var(--color-primary)",
              textDecoration: "none",
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
