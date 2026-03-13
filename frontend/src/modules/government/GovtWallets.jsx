import { useEffect, useState } from "react";
import * as govtSvc from "../../services/government.service";

export default function GovtWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [freezeModal, setFreezeModal] = useState(null);
  const [freezeReason, setFreezeReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await govtSvc.getWallets(statusFilter ? { status: statusFilter } : {});
      setWallets(res.data.wallets || res.data || []);
    } catch (err) {
      console.error("Wallets load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleFreeze = async () => {
    if (!freezeReason.trim()) return;
    try {
      await govtSvc.freezeWallet(freezeModal._id, freezeReason);
      setActionMsg({ type: "success", text: `Wallet ${freezeModal._id.slice(-6)} frozen.` });
      setFreezeModal(null);
      setFreezeReason("");
      load();
    } catch (err) {
      setActionMsg({ type: "danger", text: err.response?.data?.message || "Freeze failed." });
    }
    setTimeout(() => setActionMsg({ type: "", text: "" }), 4000);
  };

  const handleUnfreeze = async (walletId) => {
    if (!window.confirm("Restore this wallet?")) return;
    try {
      await govtSvc.unfreezeWallet(walletId);
      setActionMsg({ type: "success", text: "Wallet restored." });
      load();
    } catch {
      setActionMsg({ type: "danger", text: "Unfreeze failed." });
    }
    setTimeout(() => setActionMsg({ type: "", text: "" }), 4000);
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Aid Wallet Oversight</h1>
        <p className="page-subtitle">Monitor all beneficiary smart wallets. Freeze suspicious activity immediately.</p>
      </div>

      {actionMsg.text && <div className={`alert alert-${actionMsg.type}`}>{actionMsg.text}</div>}

      <div className="card" style={{ padding: "var(--space-4)" }}>
        <div className="row gap-4">
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: "200px" }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="FROZEN">Frozen</option>
            <option value="EXPIRED">Expired</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginLeft: "auto" }}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="card skeleton" style={{ height: "300px" }} />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Wallet ID</th>
                  <th>Beneficiary</th>
                  <th>Campaign</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Transactions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {wallets.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-faint)" }}>No wallets found</td></tr>
                ) : wallets.map(w => (
                  <tr key={w._id}>
                    <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{w._id.slice(-8)}</td>
                    <td style={{ fontSize: "13px", fontWeight: "600" }}>{w.beneficiary?.name || "—"}</td>
                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{w.campaign?.title || "—"}</td>
                    <td style={{ fontWeight: "700" }}>₹{(w.balance || 0).toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`badge ${w.status === "ACTIVE" ? "badge-green" : w.status === "FROZEN" ? "badge-red" : "badge-gray"}`}>
                        {w.status}
                      </span>
                      {w.freezeReason && (
                        <div style={{ fontSize: "10px", color: "var(--color-text-faint)", marginTop: "2px" }}>{w.freezeReason}</div>
                      )}
                    </td>
                    <td style={{ fontSize: "13px" }}>{w.merchantTransactionCount || 0}</td>
                    <td>
                      {w.status === "ACTIVE" && (
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "11px", color: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={() => { setFreezeModal(w); setFreezeReason(""); }}>
                          Freeze
                        </button>
                      )}
                      {w.status === "FROZEN" && (
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }} onClick={() => handleUnfreeze(w._id)}>
                          Unfreeze
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Freeze Modal */}
      {freezeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Freeze Wallet</h3>
            <div style={{ padding: "12px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)", marginBottom: "var(--space-4)" }}>
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Wallet ID: <strong>{freezeModal._id.slice(-8)}</strong></div>
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Balance: <strong>₹{(freezeModal.balance || 0).toLocaleString("en-IN")}</strong></div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Freeze <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <textarea className="form-input" rows={3} placeholder="Enter reason for regulatory freeze…" value={freezeReason} onChange={e => setFreezeReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setFreezeModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: "var(--color-danger)" }} disabled={!freezeReason.trim()} onClick={handleFreeze}>
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
