import { useEffect, useState } from "react";
import api from "../../services/api";
import { confirmDialog } from "../../components/ConfirmDialog";

const CATEGORY_CHOICES = ["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"];

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State for approving Merchants
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [merchantCategory, setMerchantCategory] = useState("FOOD");
  const [merchantShopName, setMerchantShopName] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/access/pending");
      setRequests(res.data?.data || res.data || []);
    } catch {
      setError("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (userId, role) => {
    if (role === "MERCHANT") {
      // Need extra info for merchants
      const user = requests.find(r => r._id === userId);
      setMerchantShopName(`${user.name}'s Shop`);
      setSelectedMerchant(user);
      return;
    }
    await processAction(userId, "approve");
  };

  const handleMerchantApproveSubmit = async (e) => {
    e.preventDefault();
    await processAction(selectedMerchant._id, "approve", {
      category: merchantCategory,
      shopName: merchantShopName
    });
    setSelectedMerchant(null);
  };

  const handleReject = async (userId) => {
    const reason = await confirmDialog(
      "This will reject the applicant's access request. They'll need to re-apply if this was a mistake.",
      {
        title: "Reject access request",
        danger: true,
        confirmLabel: "Reject",
        input: true,
        inputLabel: "Rejection reason",
        inputPlaceholder: "e.g. Did not meet KYC requirements",
      },
    );
    if (reason === null) return; // cancelled
    await processAction(userId, "reject", { reason: reason || "Did not meet KYC requirements" });
  };

  const processAction = async (userId, action, payload = {}) => {
    setActionLoading(true); setError(""); setSuccess("");
    try {
      if (action === "approve") {
        await api.post(`/admin/access/${userId}/approve`, payload);
      } else {
        await api.post(`/admin/access/${userId}/reject`, payload);
      }
      setSuccess(`User successfully ${action}d.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} user.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !requests.length) return <div className="loader-center"><div className="spinner" /></div>;

  return (
    <div className="stack-lg animate-fade-up">
      <div className="page-header">
         <h1 className="page-title">Pending KYC & Organization Requests</h1>
         <p className="page-subtitle">Review incoming registrations for NGOs, Merchants, and Government agencies. Users without approval cannot access the platform.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
         {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">No Pending Requests</div>
              <div className="empty-state-desc">All user applications have been processed.</div>
            </div>
         ) : (
            <div className="table-wrapper">
               <table className="table">
                 <thead>
                   <tr>
                     <th>Name</th>
                     <th>Email</th>
                     <th>Requested Role</th>
                     <th>Registration Date</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {requests.map(user => (
                     <tr key={user._id}>
                       <td style={{ fontWeight: "600" }}>{user.name}</td>
                       <td style={{ fontSize: "13px" }}>{user.email}</td>
                       <td>
                          <span className={`badge ${
                             user.role === 'NGO' ? 'badge-blue' :
                             user.role === 'MERCHANT' ? 'badge-purple' :
                             'badge-orange'
                          }`}>
                            {user.role}
                          </span>
                       </td>
                       <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                         {new Date(user.createdAt).toLocaleDateString("en-IN")}
                       </td>
                       <td>
                         <div className="row" style={{ gap: "8px" }}>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(user._id, user.role)}
                              disabled={actionLoading}
                            >Approve KYC</button>
                            <button 
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--color-danger)" }}
                              onClick={() => handleReject(user._id)}
                              disabled={actionLoading}
                            >Reject</button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
         )}
      </div>

      {/* Merchant Approval Modal */}
      {selectedMerchant && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Approve Merchant Profile</h3>
            <p className="form-hint" style={{ marginBottom: "var(--space-4)" }}>
              To activate this merchant, you must assign them to a rigid category. They will only be able to accept smart wallet payments explicitly allowed for this category.
            </p>

            <form onSubmit={handleMerchantApproveSubmit}>
               <div className="form-group">
                 <label className="form-label">Merchant / Shop Name</label>
                 <input 
                   type="text" 
                   className="form-input" 
                   value={merchantShopName} 
                   onChange={e => setMerchantShopName(e.target.value)}
                   required
                 />
               </div>
               
               <div className="form-group">
                 <label className="form-label">Authorized Policy Category</label>
                 <select 
                   className="form-input"
                   value={merchantCategory}
                   onChange={e => setMerchantCategory(e.target.value)}
                 >
                   {CATEGORY_CHOICES.map(cat => (
                     <option key={cat} value={cat}>{cat}</option>
                   ))}
                 </select>
               </div>

               <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setSelectedMerchant(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? "Processing…" : "Confirm & Activate Merchant"}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
