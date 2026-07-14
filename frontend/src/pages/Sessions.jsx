import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import { confirmDialog } from "../components/ConfirmDialog";

export default function Sessions() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/auth/sessions");
      setSessions(res.data.data.sessions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    const ok = await confirmDialog(
      "You'll be logged out from all devices and will need to log in again.",
      { title: "Log out everywhere?", danger: true, confirmLabel: "Log out all" },
    );
    if (!ok) return;

    setActionLoading(true);
    try {
      await api.post("/auth/logout-all");
      // Logout locally
      await logout();
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to logout from all devices",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (device) => {
    const deviceLower = (device || "").toLowerCase();
    if (
      deviceLower.includes("mobile") ||
      deviceLower.includes("android") ||
      deviceLower.includes("iphone")
    ) {
      return "📱";
    } else if (deviceLower.includes("tablet") || deviceLower.includes("ipad")) {
      return "📱";
    } else {
      return "💻";
    }
  };

  if (loading) {
    return (
      <div className="container animate-fade-up" style={{ padding: "var(--space-6)" }}>
        <div className="card">
          <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
            <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>
              ⏳
            </div>
            <p style={{ color: "var(--color-text-muted)" }}>
              Loading sessions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container animate-fade-up"
      style={{ padding: "var(--space-6)", maxWidth: "800px" }}
    >
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: "800",
            marginBottom: "var(--space-2)",
          }}
        >
          Active Sessions
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Manage your active login sessions across different devices.
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

      <div className="card" style={{ padding: "var(--space-6)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-6)",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "var(--space-1)",
              }}
            >
              Your Devices
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
              {sessions.length} active{" "}
              {sessions.length === 1 ? "session" : "sessions"}
            </p>
          </div>
          <button
            onClick={handleLogoutAll}
            disabled={actionLoading || sessions.length === 0}
            className="btn btn-danger"
            style={{ fontSize: "13px" }}
          >
            {actionLoading ? "Logging out..." : "Logout All Devices"}
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
            <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>
              🔒
            </div>
            <p style={{ color: "var(--color-text-muted)" }}>
              No active sessions found.
            </p>
          </div>
        ) : (
          <div className="stack">
            {sessions.map((session, index) => (
              <div
                key={index}
                className="hover-lift animate-fade-up"
                style={{
                  padding: "var(--space-4)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-4)",
                  animationDelay: `${index * 0.05}s`,
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ fontSize: "32px" }}>
                  {getDeviceIcon(session.device)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    {session.device}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <div>IP: {session.ip || "Unknown"}</div>
                    <div>Last used: {formatDate(session.lastUsedAt)}</div>
                    <div>Created: {formatDate(session.createdAt)}</div>
                  </div>
                </div>
                <div>
                  <span
                    className="badge badge-green"
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="alert alert-info"
          style={{ marginTop: "var(--space-6)", fontSize: "13px" }}
        >
          <strong>Security Tip:</strong> If you see any unfamiliar devices,
          logout from all devices immediately and change your password.
        </div>
      </div>
    </div>
  );
}
