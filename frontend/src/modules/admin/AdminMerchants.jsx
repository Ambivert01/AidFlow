import { useEffect, useState } from "react";
import * as adminSvc from "../../services/admin.service";

const CATEGORY_ICONS = { FOOD: "🥫", MEDICINE: "💊", SHELTER: "🏠", WATER: "💧", OTHER: "📦" };
const CATEGORIES = ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"];

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminSvc.getMerchants();
      setMerchants(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Merchants load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (m) => {
    setEditing(m);
    setEditCategory(m.category);
    setEditStatus(m.status);
    setMsg("");
  };

  const handleSave = async () => {
    try {
      await adminSvc.updateMerchant(editing._id, { category: editCategory, status: editStatus });
      setMsg("Merchant updated successfully.");
      setEditing(null);
      load();
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("Update failed.");
    }
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Merchant Management</h1>
        <p className="page-subtitle">Review, categorize, and manage all registered aid merchants on the platform.</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {loading ? (
        <div className="card skeleton" style={{ height: "300px" }} />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Transactions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {merchants.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-faint)" }}>No merchants found</td></tr>
                ) : merchants.map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{m.shopName}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{m.user?.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: "16px", marginRight: "6px" }}>{CATEGORY_ICONS[m.category]}</span>
                      <span style={{ fontSize: "12px", fontWeight: "600" }}>{m.category}</span>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {m.location?.district}, {m.location?.state}
                    </td>
                    <td>
                      <span className={`badge ${m.status === "ACTIVE" ? "badge-green" : m.status === "SUSPENDED" ? "badge-red" : "badge-yellow"}`}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", fontWeight: "600" }}>
                      {m.transactionCount || 0}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(m)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Edit Merchant: {editing.shopName}</h3>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
