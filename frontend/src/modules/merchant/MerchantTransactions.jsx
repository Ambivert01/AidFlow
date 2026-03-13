import { useState, useEffect } from "react";
import api from "../../services/api";

const CATEGORY_ICONS = {
  FOOD: "🥫", MEDICINE: "💊", SHELTER: "🏠", WATER: "💧", OTHER: "📦"
};

export default function MerchantTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL | TODAY | THIS_WEEK

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get("/merchant/transactions");
        setTransactions(res.data);
      } catch {
        console.error("Failed to fetch merchant transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Filter Logic (Client Side mapping for now)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = today - (7 * 24 * 60 * 60 * 1000);

  const filtered = transactions.filter(tx => {
    const txTime = new Date(tx.timestamp).getTime();
    if (filter === "TODAY") return txTime >= today;
    if (filter === "THIS_WEEK") return txTime >= weekAgo;
    return true; // ALL
  });

  const totalFiltered = filtered.reduce((sum, tx) => sum + tx.amount, 0);

  if (loading) return <div className="loader-center"><div className="spinner" /></div>;

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">View all settled aid payments and their verifiable audit trails.</p>
      </div>

      <div className="row-between" style={{ alignItems: "flex-end" }}>
        <div className="card-sm" style={{ display: "inline-flex", gap: "var(--space-6)", padding: "var(--space-3) var(--space-5)" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-faint)" }}>Transactions</div>
            <div style={{ fontSize: "20px", fontWeight: "800" }}>{filtered.length}</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-faint)" }}>Revenue</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--color-success)" }}>₹{totalFiltered.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <select 
          className="form-input" 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          style={{ width: "200px" }}
        >
          <option value="ALL">All Time</option>
          <option value="THIS_WEEK">Past 7 Days</option>
          <option value="TODAY">Today Only</option>
        </select>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
             <div className="empty-state-icon">📭</div>
             <div className="empty-state-title">No transactions found</div>
             <div className="empty-state-desc">Try loosening your date filters.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Audit Reference (Hash)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx._id}>
                    <td style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {tx._id}
                    </td>
                    <td>
                      <div style={{ fontWeight: "600" }}>{new Date(tx.timestamp).toLocaleDateString("en-IN")}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{new Date(tx.timestamp).toLocaleTimeString("en-IN")}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple">
                        {CATEGORY_ICONS[tx.category]} {tx.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: "800", color: "var(--color-success)", fontSize: "16px" }}>
                      +₹{tx.amount?.toLocaleString("en-IN")}
                    </td>
                    <td>
                      <a href={`/public-audit?job=${tx.jobIdHash}`} target="_blank" rel="noreferrer" 
                         style={{ textDecoration: "none" }} className="badge badge-gray border">
                         🔗 {tx.timelineEventHash?.slice(0, 16)}…
                      </a>
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
