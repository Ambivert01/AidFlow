import { useEffect, useState } from "react";
import * as govtSvc from "../../services/government.service";

const STATUS_BADGE = {
  ACTIVE: "badge-green",
  DRAFT: "badge-gray",
  PAUSED: "badge-orange",
  CLOSED: "badge-gray",
  COMPLETED: "badge-teal",
  ARCHIVED: "badge-gray",
};

const DISASTER_ICONS = {
  FLOOD: "🌊", EARTHQUAKE: "🌋", CYCLONE: "🌀", FIRE: "🔥", DROUGHT: "☀️", PANDEMIC: "🦠", OTHER: "📦",
};

export default function GovtCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionModal, setActionModal] = useState(null); // { campaign, action: 'pause'|'close' }
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await govtSvc.getCampaigns(statusFilter ? { status: statusFilter } : {});
      setCampaigns(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Campaigns load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleAction = async () => {
    if (!reason.trim()) return;
    try {
      if (actionModal.action === "pause") {
        await govtSvc.pauseCampaign(actionModal.campaign._id, reason);
        setMsg({ type: "success", text: "Campaign paused successfully." });
      } else {
        await govtSvc.closeCampaign(actionModal.campaign._id, reason);
        setMsg({ type: "success", text: "Campaign closed." });
      }
      setActionModal(null);
      setReason("");
      load();
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.message || "Action failed." });
    }
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Campaign Oversight</h1>
        <p className="page-subtitle">Monitor all NGO humanitarian campaigns. Pause or close non-compliant programs.</p>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card" style={{ padding: "var(--space-4)" }}>
        <div className="row gap-4">
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: "200px" }}>
            <option value="">All Statuses</option>
            {["ACTIVE","DRAFT","PAUSED","CLOSED","COMPLETED"].map(s => <option key={s} value={s}>{s}</option>)}
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
                  <th>Campaign</th>
                  <th>NGO</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Raised</th>
                  <th>Beneficiaries</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--color-text-faint)" }}>No campaigns found</td></tr>
                ) : campaigns.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "20px" }}>{DISASTER_ICONS[c.disasterType] || "📦"}</span>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{c.title}</div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.disasterType}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "12px" }}>{c.createdBy?.name || "—"}</td>
                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{c.location?.district}, {c.location?.state}</td>
                    <td><span className={`badge ${STATUS_BADGE[c.status] || "badge-gray"}`}>{c.status}</span></td>
                    <td style={{ fontWeight: "700" }}>₹{(c.totalDonated || 0).toLocaleString("en-IN")}</td>
                    <td style={{ fontSize: "13px" }}>{c.totalBeneficiaries || 0}</td>
                    <td>
                      <div className="row gap-2">
                        {c.status === "ACTIVE" && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: "11px", color: "var(--color-warning)", borderColor: "var(--color-warning)" }} onClick={() => { setActionModal({ campaign: c, action: "pause" }); setReason(""); }}>
                            Pause
                          </button>
                        )}
                        {["ACTIVE","PAUSED"].includes(c.status) && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: "11px", color: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={() => { setActionModal({ campaign: c, action: "close" }); setReason(""); }}>
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">{actionModal.action === "pause" ? "Pause Campaign" : "Close Campaign"}</h3>
            <div style={{ padding: "12px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)", marginBottom: "var(--space-4)" }}>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>{actionModal.campaign.title}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>NGO: {actionModal.campaign.createdBy?.name}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Official Reason <span style={{ color: "var(--color-danger)" }}>*</span></label>
              <textarea className="form-input" rows={3} placeholder={`Reason for ${actionModal.action}…`} value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ background: actionModal.action === "close" ? "var(--color-danger)" : "var(--color-warning)" }}
                disabled={!reason.trim()}
                onClick={handleAction}
              >
                Confirm {actionModal.action === "pause" ? "Pause" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
