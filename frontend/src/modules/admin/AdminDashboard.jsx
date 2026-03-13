import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Admin dashboard error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '30%' }} />
        </div>
        <div className="grid-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton" style={{ height: '100px' }} />
          ))}
        </div>
        <div className="grid-2 mt-8">
          <div className="card skeleton" style={{ height: '280px' }} />
          <div className="card skeleton" style={{ height: '280px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">System Administration</h1>
        <p className="page-subtitle">Manage users, approve organizations, and oversee platform integrity.</p>
      </div>

      {stats && (
        <div className="grid-4">
          <div className="stat-card">
             <div className="stat-card-label">Total Users</div>
             <div className="stat-card-value">{stats.totalUsers || 0}</div>
             <div className="stat-card-sub">Active platform accounts</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: "var(--color-primary)" }}>
             <div className="stat-card-label">Organizations</div>
             <div className="stat-card-value">{stats.totalNGOs || 0} NGOs</div>
             <div className="stat-card-sub">{stats.totalMerchants || 0} Merchants</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: "var(--color-success)" }}>
             <div className="stat-card-label">Total Volume</div>
             <div className="stat-card-value">₹{(stats.totalDonationVolume || 0).toLocaleString("en-IN")}</div>
             <div className="stat-card-sub">Through system lifetime</div>
          </div>
          <div className="stat-card" style={{ borderTopColor: "var(--color-purple)" }}>
             <div className="stat-card-label">Immutable Logs</div>
             <div className="stat-card-value">{stats.totalAuditLogs || 0}</div>
             <div className="stat-card-sub">Cryptographically hashed actions</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Pending Approvals Widget */}
        <div className="card stack">
           <div className="row-between">
             <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Action Required</h2>
             {stats?.pendingRequests > 0 && <span className="badge badge-red">{stats.pendingRequests} Pending</span>}
           </div>
           
           {stats?.pendingRequests === 0 ? (
             <div className="empty-state" style={{ padding: "var(--space-6)" }}>
                <div className="empty-state-icon" style={{ fontSize: "24px" }}>✨</div>
                <div className="empty-state-title" style={{ fontSize: "14px" }}>Inbox Zero</div>
                <div className="empty-state-desc" style={{ fontSize: "12px" }}>No pending access requests.</div>
             </div>
           ) : (
             <div className="stack">
               <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                 Organizations (NGOs, Merchants, Government entities) have submitted access requests and are waiting for KYC approval.
               </p>
               <Link to="/admin/requests" className="btn btn-primary">
                 Review {stats?.pendingRequests} Requests
               </Link>
             </div>
           )}
        </div>

        {/* Quick Links */}
        <div className="card stack">
           <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Management Tools</h2>
           <div className="grid-2 mt-2">
              <Link to="/admin/users" className="btn btn-ghost" style={{ padding: "16px", flexDirection: "column", height: "auto", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>👥</span>
                <span style={{ fontWeight: "700" }}>User Directory</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-faint)", whiteSpace: "normal", textAlign: "left" }}>Manage roles and suspend accounts.</span>
              </Link>
              <Link to="/admin/merchants" className="btn btn-ghost" style={{ padding: "16px", flexDirection: "column", height: "auto", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>🏪</span>
                <span style={{ fontWeight: "700" }}>Merchants</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-faint)", whiteSpace: "normal", textAlign: "left" }}>Manage categories and suspend merchants.</span>
              </Link>
              <Link to="/admin/audit" className="btn btn-ghost" style={{ padding: "16px", flexDirection: "column", height: "auto", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "24px" }}>🔍</span>
                <span style={{ fontWeight: "700" }}>Audit Log</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-faint)", whiteSpace: "normal", textAlign: "left" }}>Browse immutable system events.</span>
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
}
