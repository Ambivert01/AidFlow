import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function GovtDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get("/government/overview");
        setStats(res.data?.data || res.data);
      } catch (err) {
        console.error("Govt dashboard error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
        <div className="grid-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton" style={{ height: '100px' }} />
          ))}
        </div>
        <div className="grid-2 mt-8">
          <div className="card skeleton" style={{ height: '240px' }} />
          <div className="card skeleton" style={{ height: '240px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Government Oversight Dashboard</h1>
        <p className="page-subtitle">Monitor systemic risk, review escalations, and audit humanitarian financial flows.</p>
      </div>

      {stats && (
        <div className="grid-4">
          <div className="stat-card" style={{ borderTopColor: "var(--color-primary)" }}>
             <div className="stat-card-label">Total Active Aid</div>
             <div className="stat-card-value">₹{(stats.totalDisbursed || 0).toLocaleString("en-IN")}</div>
             <div className="stat-card-sub">In {stats.activeWallets} active wallets</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: "var(--color-danger)" }}>
             <div className="stat-card-label">Frozen Funds</div>
             <div className="stat-card-value">₹{(stats.frozenAmount || 0).toLocaleString("en-IN")}</div>
             <div className="stat-card-sub">In {stats.frozenWallets} frozen wallets</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: "var(--color-warning)" }}>
             <div className="stat-card-label">Escalations</div>
             <div className="stat-card-value">{stats.escalatedDonations || 0}</div>
             <div className="stat-card-sub">Pending Govt Review</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: "var(--color-secondary)" }}>
             <div className="stat-card-label">Total Campaigns</div>
             <div className="stat-card-value">{stats.activeCampaigns || 0}</div>
             <div className="stat-card-sub">Currently Active</div>
          </div>
        </div>
      )}

      {/* Action Grid */}
      <div className="grid-2">
        <div className="card stack">
           <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Compliance & Risk</h2>
           <div className="grid-2">
              <Link to="/government/escalated" className="btn btn-ghost" style={{ padding: "16px", flexDirection: "column", height: "auto", gap: "8px", alignItems: "flex-start", background: stats?.escalatedDonations > 0 ? "var(--color-danger)" : "", color: stats?.escalatedDonations > 0 ? "white" : "" }}>
                <span style={{ fontSize: "24px" }}>🚨</span>
                <span style={{ fontWeight: "700" }}>Review Escalations</span>
                <span style={{ fontSize: "12px", opacity: 0.8, whiteSpace: "normal", textAlign: "left" }}>
                  {stats?.escalatedDonations > 0 ? `${stats.escalatedDonations} high-risk donations require immediate clearance.` : "No pending escalations."}
                </span>
              </Link>
              
              <Link to="/government/fraud" className="btn btn-ghost" style={{ padding: "16px", flexDirection: "column", height: "auto", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>🛡️</span>
                <span style={{ fontWeight: "700" }}>Fraud Monitor</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-faint)", whiteSpace: "normal", textAlign: "left" }}>
                  Monitor AI flags, merchant violations, and freeze illicit wallets.
                </span>
              </Link>
           </div>
        </div>

        <div className="card stack">
           <h2 style={{ fontSize: "16px", fontWeight: "700" }}>System Oversight</h2>
           <div className="grid-2">
              <Link to="/government/wallets" className="btn btn-ghost" style={{ padding: "16px", flexDirection: "column", height: "auto", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>💼</span>
                <span style={{ fontWeight: "700" }}>Aid Wallets</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-faint)", whiteSpace: "normal", textAlign: "left" }}>
                  View all active and frozen beneficiary smart wallets.
                </span>
              </Link>

              <Link to="/government/campaigns" className="btn btn-ghost" style={{ padding: "16px", flexDirection: "column", height: "auto", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>📋</span>
                <span style={{ fontWeight: "700" }}>Campaigns</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-faint)", whiteSpace: "normal", textAlign: "left" }}>
                  Monitor NGO campaigns. Pause or close non-compliant programs.
                </span>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
