import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError("Invalid verification link");
        setLoading(false);
        return;
      }

      try {
        await api.post("/auth/verify-email", { token });
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => navigate("/login"), 3000);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Verification failed. The link may have expired.",
        );
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (loading) {
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
          <div
            style={{
              fontSize: "48px",
              margin: "0 auto",
              animation: "spin 1s linear infinite",
            }}
          >
            ⏳
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
            Verifying Your Email...
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

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
          <div style={{ fontSize: "64px", margin: "0 auto" }}>✅</div>
          <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
            Email Verified Successfully
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            Your email address has been verified. You can now log in to your
            account.
          </p>
          <div
            className="alert alert-success"
            style={{ textAlign: "left", fontSize: "13px" }}
          >
            <strong>Next Step:</strong> Log in with your email and password to
            access your dashboard.
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
        <div style={{ fontSize: "64px", margin: "0 auto" }}>❌</div>
        <h2 style={{ fontSize: "24px", fontWeight: "800" }}>
          Verification Failed
        </h2>
        <p style={{ color: "var(--color-text-muted)" }}>{error}</p>
        <div
          className="alert alert-danger"
          style={{ textAlign: "left", fontSize: "13px" }}
        >
          <strong>Possible reasons:</strong>
          <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
            <li>The verification link has expired (24 hours)</li>
            <li>The link has already been used</li>
            <li>The link is invalid or corrupted</li>
          </ul>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            marginTop: "var(--space-4)",
          }}
        >
          <Link to="/login" className="btn btn-ghost" style={{ flex: 1 }}>
            Go to Login
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ flex: 1 }}>
            Register Again
          </Link>
        </div>
      </div>
    </div>
  );
}
