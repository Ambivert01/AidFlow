import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const CATEGORY_ICONS = {
  FOOD: "🥫", MEDICINE: "💊", SHELTER: "🏠", WATER: "💧", OTHER: "📦"
};

export default function MerchantDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, txRes] = await Promise.all([
          api.get("/merchant/me"),
          api.get("/merchant/transactions").catch(() => ({ data: { data: [] } })),
        ]);

        const txns = txRes.data?.data || txRes.data || [];
        const today = new Date();
        const sameDay = (d) =>
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate();

        const todayTx = txns.filter((t) => t.timestamp && sameDay(new Date(t.timestamp)));
        const todaySettled = todayTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalSettled = txns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        setStats({
          merchantProfile: profileRes.data?.data || profileRes.data,
          todaySettled,
          todayCount: todayTx.length,
          totalSettled,
          totalTransactions: txns.length,
        });

        setRecentTransactions(txns.slice(0, 5));
      } catch (err) {
        console.error("Merchant dashboard error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '30%' }} />
        </div>
        <div className="card skeleton" style={{ height: '80px' }} />
        <div className="grid-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="stat-card skeleton" style={{ height: '100px' }} />
          ))}
        </div>
        <div className="card skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  const mProf = stats?.merchantProfile;

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Merchant Terminal</h1>
        <p className="page-subtitle">Scan beneficiary wallets to process authorized aid payments securely.</p>
      </div>

      {/* Account Status / Profile Bar */}
      {mProf && (
        <div className="card row-between" style={{ padding: "var(--space-4)", background: "var(--color-surface-alt)" }}>
          <div className="row">
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "var(--shadow-sm)" }}>
              {CATEGORY_ICONS[mProf.category] || "🏪"}
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px" }}>{mProf.shopName || "Registered Merchant"}</div>
              <div className="row" style={{ fontSize: "12px", color: "var(--color-text-muted)", gap: "var(--space-2)" }}>
                 <span>{mProf.location?.district}, {mProf.location?.state}</span>
                 <span style={{ color: "var(--color-border-strong)" }}>•</span>
                 <span className="badge badge-purple" style={{ padding: "0 6px", fontSize: "10px" }}>{mProf.category} Partner</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
             <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-faint)" }}>Trust Score</div>
             <div style={{ fontSize: "18px", fontWeight: "800", color: mProf.riskScore < 20 ? "var(--color-success)" : "var(--color-warning)" }}>
                {100 - (mProf.riskScore || 0)}/100
             </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid-3">
          <div className="stat-card" style={{ borderTop: "3px solid var(--color-primary)" }}>
            <div className="stat-card-label">Today's Revenue</div>
            <div className="stat-card-value" style={{ color: "var(--color-primary-dark)" }}>₹{(stats.todaySettled || 0).toLocaleString("en-IN")}</div>
            <div className="stat-card-sub">{stats.todayCount || 0} transactions today</div>
          </div>
          <div className="stat-card" style={{ borderTop: "3px solid var(--color-secondary)" }}>
            <div className="stat-card-label">Total Settled</div>
            <div className="stat-card-value">₹{(stats.totalSettled || 0).toLocaleString("en-IN")}</div>
            <div className="stat-card-sub">All-time revenue</div>
          </div>
          <div className="stat-card" style={{ borderTop: "3px solid var(--color-text-muted)" }}>
            <div className="stat-card-label">Total Transactions</div>
            <div className="stat-card-value">{stats.totalTransactions || 0}</div>
            <div className="stat-card-sub">Process count</div>
          </div>
        </div>
      )}

      {/* Scan Action */}
      <div className="card text-center stack" style={{ padding: "var(--space-8)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800" }}>Receive Payment</h2>
        <p style={{ color: "var(--color-text-muted)", maxWidth: "500px", margin: "0 auto" }}>
          Scan a beneficiary's dynamic JWT QR token to instantly verify their aid wallet policy and process a payment.
        </p>
        <div style={{ marginTop: "var(--space-4)" }}>
          <Link to="/merchant/scan" className="btn btn-primary btn-lg" style={{ padding: "16px 40px", fontSize: "18px", borderRadius: "100px", boxShadow: "0 8px 20px rgba(232,83,11,0.3)" }}>
            <span style={{ fontSize: "24px", marginRight: "var(--space-2)" }}>📷</span> Scan Beneficiary QR
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Recent Transactions</h2>
          <Link to="/merchant/transactions" className="btn btn-ghost btn-sm">View All</Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-desc">When you scan user QRs, payments will instantly appear here.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Wallet ID</th>
                  <th>Audit Hash</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(tx => (
                  <tr key={tx.id || `${tx.walletId}_${tx.timestamp}`}>
                    <td style={{ fontSize: "13px" }}>{new Date(tx.timestamp).toLocaleString("en-IN")}</td>
                    <td style={{ fontWeight: "700", color: "var(--color-success)" }}>+₹{tx.amount.toLocaleString("en-IN")}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-text-muted)" }}>{tx.walletId?.slice(-8)}</td>
                    <td style={{ fontSize: "11px" }}>
                       <span style={{ background: "var(--color-surface-alt)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                         {String(tx.walletId || "").slice(-8)}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
