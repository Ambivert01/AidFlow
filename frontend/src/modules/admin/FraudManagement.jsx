import { useState, useEffect } from "react";
import api from "../../services/api";
import { useToast } from "../../components/toastContext";

export default function FraudManagement() {
  const [fraudCases, setFraudCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("OPEN");
  const [selectedCase, setSelectedCase] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const showToast = useToast();
  const [resolveForm, setResolveForm] = useState({
    decision: "CONFIRMED_FRAUD",
    notes: "",
    actionTaken: "",
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes, statsRes] = await Promise.all([
        api.get(`/admin/fraud-cases?status=${filter}`),
        api.get("/admin/fraud-stats"),
      ]);
      setFraudCases(casesRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error("Failed to fetch fraud data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await api.patch(
        `/admin/fraud-cases/${selectedCase._id}/resolve`,
        resolveForm,
      );
      setShowResolveModal(false);
      setSelectedCase(null);
      setResolveForm({
        decision: "CONFIRMED_FRAUD",
        notes: "",
        actionTaken: "",
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to resolve case", "error");
    }
  };

  const handleAssign = async (caseId, investigatorId) => {
    try {
      await api.post(`/admin/fraud-cases/${caseId}/assign`, { investigatorId });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to assign case", "error");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: "bg-[var(--color-alert-light)] text-[var(--color-alert-dark)]",
      INVESTIGATING: "bg-[var(--color-caution-light)] text-[var(--color-caution)]",
      RESOLVED: "bg-[var(--color-verified-light)] text-[var(--color-verified-dark)]",
      DISMISSED: "bg-[var(--color-paper-alt)] text-[var(--color-ink)]",
    };
    return colors[status] || "bg-[var(--color-paper-alt)] text-[var(--color-ink)]";
  };

  if (loading) {
    return (
      <div className="container animate-fade-up" style={{ padding: "var(--space-6)" }}>
        <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>
            ⏳
          </div>
          <p style={{ color: "var(--color-text-muted)" }}>
            Loading fraud cases...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "var(--space-6)" }}>
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
          Fraud Management
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Monitor and investigate fraud cases across the platform
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-4)",
            marginBottom: "var(--space-6)",
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
              Total Cases
            </div>
            <div style={{ fontSize: "32px", fontWeight: "800" }}>
              {stats.totalCases}
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
              Open Cases
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "var(--color-danger)",
              }}
            >
              {stats.openCases}
            </div>
          </div>
          <div
            className="card"
            style={{
              padding: "var(--space-4)",
              borderLeft: "4px solid var(--color-warning)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-1)",
              }}
            >
              Investigating
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "var(--color-warning)",
              }}
            >
              {stats.investigating}
            </div>
          </div>
          <div
            className="card"
            style={{
              padding: "var(--space-4)",
              borderLeft: "4px solid var(--color-success)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginBottom: "var(--space-1)",
              }}
            >
              Confirmed Fraud
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "var(--color-success)",
              }}
            >
              {stats.confirmedFraud}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="card"
        style={{ padding: "var(--space-4)", marginBottom: "var(--space-4)" }}
      >
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn ${filter === status ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "13px" }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Cases List */}
      <div className="card" style={{ padding: "var(--space-6)" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "var(--space-4)",
          }}
        >
          Fraud Cases ({fraudCases.length})
        </h2>

        {fraudCases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
            <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>
              ✅
            </div>
            <p style={{ color: "var(--color-text-muted)" }}>
              No {filter.toLowerCase()} cases found
            </p>
          </div>
        ) : (
          <div className="stack">
            {fraudCases.map((fraudCase) => (
              <div
                key={fraudCase._id}
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
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      <span style={{ fontWeight: "600", fontSize: "16px" }}>
                        {fraudCase.entityType} -{" "}
                        {fraudCase.entityId.slice(0, 8)}
                      </span>
                      <span
                        className={`badge ${getStatusBadge(fraudCase.status)}`}
                        style={{ fontSize: "11px", padding: "2px 8px" }}
                      >
                        {fraudCase.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Risk Score: <strong>{fraudCase.riskScore}/100</strong>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {new Date(fraudCase.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div
                  style={{ fontSize: "14px", marginBottom: "var(--space-3)" }}
                >
                  <strong>Reason:</strong> {fraudCase.reason}
                </div>

                {fraudCase.assignedTo && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-text-muted)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    Assigned to: <strong>{fraudCase.assignedTo.name}</strong>
                  </div>
                )}

                {fraudCase.resolution && (
                  <div
                    style={{
                      padding: "var(--space-3)",
                      background: "var(--color-bg-subtle)",
                      borderRadius: "4px",
                      fontSize: "13px",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    <div>
                      <strong>Decision:</strong> {fraudCase.resolution.decision}
                    </div>
                    {fraudCase.resolution.notes && (
                      <div>
                        <strong>Notes:</strong> {fraudCase.resolution.notes}
                      </div>
                    )}
                    {fraudCase.resolution.actionTaken && (
                      <div>
                        <strong>Action:</strong>{" "}
                        {fraudCase.resolution.actionTaken}
                      </div>
                    )}
                  </div>
                )}

                {fraudCase.status !== "RESOLVED" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-2)",
                      marginTop: "var(--space-3)",
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedCase(fraudCase);
                        setShowResolveModal(true);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Resolve Case
                    </button>
                    <button className="btn btn-ghost btn-sm">
                      View Details
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedCase && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowResolveModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "var(--space-6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "800",
                marginBottom: "var(--space-4)",
              }}
            >
              Resolve Fraud Case
            </h2>

            <form onSubmit={handleResolve} className="stack">
              <div className="form-group">
                <label className="form-label">Decision</label>
                <select
                  className="form-input"
                  value={resolveForm.decision}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, decision: e.target.value })
                  }
                  required
                >
                  <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
                  <option value="FALSE_POSITIVE">False Positive</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={resolveForm.notes}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, notes: e.target.value })
                  }
                  placeholder="Investigation notes..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Action Taken</label>
                <input
                  type="text"
                  className="form-input"
                  value={resolveForm.actionTaken}
                  onChange={(e) =>
                    setResolveForm({
                      ...resolveForm,
                      actionTaken: e.target.value,
                    })
                  }
                  placeholder="e.g., Wallet frozen, User banned"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-4)",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Resolve Case
                </button>
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
