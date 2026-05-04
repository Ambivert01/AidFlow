import { useState, useEffect } from "react";
import api from "../../services/api";

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [anchors, setAnchors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [healthRes, anchorsRes] = await Promise.all([
        api.get("/admin/system/health"),
        api.get("/admin/blockchain/anchors?limit=10"),
      ]);
      setHealth(healthRes.data.data);
      setAnchors(anchorsRes.data.data);
    } catch (err) {
      console.error("Failed to fetch system health:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "connected" || status === "healthy")
      return "var(--color-success)";
    if (status === "warning") return "var(--color-warning)";
    return "var(--color-danger)";
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "var(--space-6)" }}>
        <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>
            ⏳
          </div>
          <p style={{ color: "var(--color-text-muted)" }}>
            Loading system health...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "var(--space-6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginBottom: "var(--space-2)",
            }}
          >
            🏥 System Health
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Monitor system status, database health, and blockchain integrity
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost">
          🔄 Refresh
        </button>
      </div>

      {health && (
        <>
          {/* Database Status */}
          <div
            className="card"
            style={{
              padding: "var(--space-6)",
              marginBottom: "var(--space-4)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                marginBottom: "var(--space-4)",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: getStatusColor(health.database),
                }}
              />
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>
                Database Status
              </h2>
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              {health.database}
            </div>
          </div>

          {/* System Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "var(--space-4)",
              marginBottom: "var(--space-4)",
            }}
          >
            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-1)",
                }}
              >
                Total Users
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800" }}>
                {health.users.total.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-success)",
                  marginTop: "var(--space-1)",
                }}
              >
                {health.users.active.toLocaleString()} active
              </div>
            </div>

            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-1)",
                }}
              >
                Total Donations
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800" }}>
                {health.donations.total.toLocaleString()}
              </div>
            </div>

            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-1)",
                }}
              >
                Active Campaigns
              </div>
              <div style={{ fontSize: "32px", fontWeight: "800" }}>
                {health.campaigns.active.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  marginTop: "var(--space-1)",
                }}
              >
                of {health.campaigns.total.toLocaleString()} total
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "var(--space-4)",
                borderLeft: "4px solid var(--color-danger)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-1)",
                }}
              >
                Open Fraud Cases
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "var(--color-danger)",
                }}
              >
                {health.fraud.openCases}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div
            className="card"
            style={{
              padding: "var(--space-4)",
              marginBottom: "var(--space-4)",
            }}
          >
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Last updated: {new Date(health.timestamp).toLocaleString()}
            </div>
          </div>
        </>
      )}

      {/* Blockchain Anchors */}
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "var(--space-4)",
          }}
        >
          ⛓️ Recent Blockchain Anchors
        </h2>

        {anchors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
            <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>
              📦
            </div>
            <p style={{ color: "var(--color-text-muted)" }}>
              No blockchain anchors found
            </p>
          </div>
        ) : (
          <div className="stack">
            {anchors.map((anchor) => (
              <div
                key={anchor._id}
                style={{
                  padding: "var(--space-4)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "14px",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      {anchor.entityType}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      {anchor.entityId}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      background:
                        anchor.status === "ANCHORED"
                          ? "var(--color-success-light)"
                          : "var(--color-warning-light)",
                      color:
                        anchor.status === "ANCHORED"
                          ? "var(--color-success-dark)"
                          : "var(--color-warning-dark)",
                    }}
                  >
                    {anchor.status}
                  </span>
                </div>

                {anchor.txHash && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    <strong>TX Hash:</strong>{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      {anchor.txHash.slice(0, 16)}...
                    </span>
                  </div>
                )}

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    marginTop: "var(--space-1)",
                  }}
                >
                  {new Date(anchor.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Info */}
      <div
        className="card"
        style={{ padding: "var(--space-6)", marginTop: "var(--space-4)" }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "var(--space-4)",
          }}
        >
          ℹ️ System Information
        </h2>
        <div className="stack" style={{ fontSize: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              Platform Version:
            </span>
            <strong>1.0.0</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              Environment:
            </span>
            <strong>Production</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Uptime:</span>
            <strong>99.9%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
