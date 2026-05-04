import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
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

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setError(
        "Password must be at least 6 characters and contain uppercase, lowercase, and number",
      );
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. The link may have expired.",
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
          <div style={{ fontSize: "64px", margin: "0 auto" }}>✅</div>
          <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
            Password Reset Successful
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            Your password has been reset successfully. You can now log in with
            your new password.
          </p>
          <div
            className="alert alert-success"
            style={{ textAlign: "left", fontSize: "13px" }}
          >
            <strong>Note:</strong> For security, you've been logged out from all
            devices. Please log in again.
          </div>
          <Link to="/login" className="btn btn-primary mt-4">
            Go to Login
          </Link>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "12px",
              marginTop: "var(--space-2)",
            }}
          >
            Redirecting in 3 seconds...
          </p>
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
            Reset Your Password
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            Enter your new password below.
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
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="newPassword"
              className="form-input"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="At least 6 characters"
              minLength="6"
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

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              minLength="6"
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
            {loading ? "Resetting..." : "Reset Password"}
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
