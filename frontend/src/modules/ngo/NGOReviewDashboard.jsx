import { useEffect, useState } from "react";
import api from "../../services/api";

export default function NGOReviewDashboard() {
  const [donations, setDonations] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donRes, benRes] = await Promise.all([
        api.get("/ngo/donations/pending"),
        api.get("/ngo/beneficiaries?status=ACTIVE"), // Only active ones can receive donations
      ]);
      setDonations(donRes.data || []);
      setBeneficiaries(benRes.data || []);
    } catch {
      setError("Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedBeneficiaryId || !selectedDonation) return;
    
    setActionLoading(true); setError(""); setSuccess("");
    try {
      await api.post(`/ngo/donations/${selectedDonation._id}/assign`, {
        beneficiaryId: selectedBeneficiaryId,
      });
      
      // Auto-approve after assignment
      await api.post(`/ngo/donations/${selectedDonation._id}/approve`);
      
      setSuccess(`Donation successfully assigned and wallet created!`);
      setSelectedDonation(null);
      setSelectedBeneficiaryId("");
      fetchData(); // reload
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign donation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (donationId) => {
    if (!window.confirm("Are you sure you want to reject this donation?")) return;
    
    setActionLoading(true); setError(""); setSuccess("");
    try {
      await api.post(`/ngo/donations/${donationId}/reject`, { reason: "Rejected by NGO admin during review" });
      setSuccess("Donation rejected.");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !donations.length) return <div className="loader-center"><div className="spinner" /></div>;

  return (
    <div className="stack-lg">
      <div className="page-header">
        <h1 className="page-title">Review & Assign Aid</h1>
        <p className="page-subtitle">Assign incoming donations to approved beneficiaries to instantly generate their smart wallets.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card text-center" style={{ padding: "var(--space-4)", background: "var(--color-surface-alt)" }}>
        <div style={{ fontSize: "14px", fontWeight: "600" }}>{donations.length} Pending Donations</div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Total value: ₹{donations.reduce((s, d) => s + d.amount, 0).toLocaleString("en-IN")}</div>
      </div>

      {donations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">No pending donations</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Campaign</th>
                <th>Amount</th>
                <th>AI Risk Check</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d._id}>
                  <td>
                    <div style={{ fontWeight: "600" }}>{d.donor?.name || "Anonymous"}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-faint)" }}>{d._id.slice(-6)}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "13px" }}>{d.campaign?.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{d.campaign?.disasterType}</div>
                  </td>
                  <td style={{ fontWeight: "700", color: "var(--color-primary-dark)" }}>₹{d.amount?.toLocaleString("en-IN")}</td>
                  <td>
                    {d.aiDecision ? (
                      <div className="stack-xs">
                        <span className={`badge ${d.aiDecision === "ALLOW" ? "badge-green" : d.aiDecision === "BLOCK" ? "badge-red" : "badge-yellow"}`}>
                          {d.aiDecision}
                        </span>
                        {d.aiRiskScore !== undefined && (
                          <div className="text-[10px] font-bold text-slate-400">Risk: {d.aiRiskScore}/100</div>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-gray">Pending AI</span>
                    )}
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {new Date(d.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td>
                    <div className="row" style={{ gap: "8px" }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedDonation(d)}
                        disabled={actionLoading}
                      >Assign & Appr.</button>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleReject(d._id)}
                        disabled={actionLoading}
                        style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                      >Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignment Modal */}
      {selectedDonation && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Assign Donation to Beneficiary</h3>
            <div style={{ marginBottom: "var(--space-4)", padding: "12px", background: "var(--color-surface-alt)", borderRadius: "var(--radius)" }}>
              <div className="row-between">
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Amount to disburse:</span>
                <span style={{ fontWeight: "700", fontSize: "18px", color: "var(--color-primary-dark)" }}>₹{selectedDonation.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="row-between" style={{ mt: "4px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Campaign:</span>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>{selectedDonation.campaign?.title}</span>
              </div>
            </div>

            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">Select ACTIVE Beneficiary</label>
                <select 
                  className="form-input"
                  value={selectedBeneficiaryId}
                  onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                  required
                >
                  <option value="">-- Select a beneficiary in this campaign --</option>
                  {beneficiaries
                    .filter(b => b.campaign?._id === selectedDonation.campaign?._id || b.campaign === selectedDonation.campaign?._id)
                    .map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name} (Vulnerability: {b.vulnerabilityScore}/100)
                      </option>
                    ))}
                </select>
                <div className="form-hint">Only beneficiaries with 'ACTIVE' status (approved) in this specific campaign can receive funds.</div>
              </div>

              <div className="alert alert-info" style={{ marginTop: "var(--space-4)" }}>
                ℹ️ Approving will instantly create a smart wallet for this beneficiary locked to the campaign's policies.
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedDonation(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading || !selectedBeneficiaryId}>
                  {actionLoading ? "Processing…" : "Confirm & Create Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
