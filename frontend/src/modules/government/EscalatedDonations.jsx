import { useEffect, useState } from "react";
import api from "../../services/api";
import { confirmDialog } from "../../components/ConfirmDialog";

export default function EscalatedDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEscalated = async () => {
    setLoading(true);
    try {
      const res = await api.get("/government/donations/escalated");
      setDonations(res.data?.data || res.data || []);
    } catch {
      setError("Failed to fetch escalated donations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalated();
  }, []);

  const handleAction = async (id, action) => {
    const confirmed = await confirmDialog(
      `Are you sure you want to ${action.toUpperCase()} this high-risk donation?`,
      {
        title: `${action === "approve" ? "Approve" : "Reject"} donation`,
        danger: action !== "approve",
        confirmLabel: action === "approve" ? "Approve" : "Reject",
      },
    );
    if (!confirmed) return;
    
    setActionLoading(true); setError(""); setSuccess("");
    try {
      const endpoint = action === "approve" ? `/government/donations/${id}/approve` : `/government/donations/${id}/reject`;
      await api.post(endpoint, { reason: `Government authority ${action} decision after review.` });
      
      setSuccess(`Donation successfully ${action}d. ${action === 'approve' ? 'It has been cleared for NGO review.' : ''}`);
      fetchEscalated(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} donation.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !donations.length) return <div className="page-loader"><div className="spinner"></div><p>Querying Risk Ledger...</p></div>;

  return (
    <div className="stack-lg">
      <div className="page-header border-b pb-6">
         <div className="row-between">
            <div>
               <h1 className="page-title text-2xl font-black">High-Risk Review Board</h1>
               <p className="page-subtitle text-[var(--color-steel)]">Manual government clearance required for donations exceeding safety thresholds.</p>
            </div>
            <div className="flex gap-2">
               <span className="badge badge-error bg-[var(--color-alert-light)] text-[var(--color-alert-dark)] font-bold px-4 py-2 rounded-xl border border-[var(--color-alert-light)]">
                 {donations.length} PENDING ACTION
               </span>
            </div>
         </div>
      </div>

      {error && <div className="alert alert-danger bg-[var(--color-alert-light)] text-[var(--color-alert-dark)] p-4 rounded-xl border border-[var(--color-alert-light)] mb-6">⚠️ {error}</div>}
      {success && <div className="alert alert-success bg-[var(--color-verified-light)] text-[var(--color-verified-dark)] p-4 rounded-xl border border-[var(--color-verified-light)] mb-6">✅ {success}</div>}

      <div className="stack gap-6">
        {donations.length === 0 ? (
          <div className="card text-center py-24 bg-[var(--color-paper-alt)] border-dashed border-2">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">System Clean</h2>
            <p className="max-w-md mx-auto text-[var(--color-steel)] mt-2">All flagged financial flows have been cleared or blocked by the oversight authority.</p>
          </div>
        ) : (
          <div className="grid gap-4">
             {donations.map(d => (
               <div key={d._id} className="card shadow-sm hover:shadow-md transition-shadow grid md:grid-cols-[1fr_2fr_1.5fr] gap-6 p-6 border-l-4 border-[var(--color-alert)] bg-white">
                  <div className="stack gap-4">
                    <div>
                       <div className="text-[10px] font-black uppercase text-[var(--color-steel)]">Transaction Value</div>
                       <div className="text-3xl font-black text-[var(--color-ink)] tabular-nums">₹{d.amount.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="bg-[var(--color-paper-alt)] p-3 rounded-xl">
                       <div className="text-[9px] font-bold uppercase text-[var(--color-steel)] mb-1">AI Risk Evaluation</div>
                       <div className="row-between">
                          <span className={`font-black text-lg ${(d.aiDecision?.riskScore || 0) > 90 ? 'text-[var(--color-alert)]' : 'text-[var(--color-signal)]'}`}>{d.aiDecision?.riskScore ?? "N/A"}/100</span>
                          <span className="text-[8px] font-black uppercase bg-white px-2 py-1 rounded shadow-sm">CRITICAL</span>
                       </div>
                    </div>
                  </div>

                  <div className="stack gap-4 border-x border-[var(--color-paper-alt)] px-6">
                    <div>
                       <div className="text-[10px] font-black uppercase text-[var(--color-steel)]">Mission Target</div>
                       <div className="font-bold text-[var(--color-ink)] truncate">{d.campaign?.title}</div>
                       <div className="text-[11px] text-[var(--color-steel)]">{d.campaign?.location?.state}, India</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase text-[var(--color-steel)] mb-1">Anomalies Detected</div>
                       <div className="flex flex-wrap gap-2">
                          {(d.aiDecision?.fraudFlags || []).map(flag => (
                            <span key={flag} className="text-[9px] font-bold bg-[var(--color-alert-light)] text-[var(--color-alert)] px-2 py-1 rounded-lg border border-[var(--color-alert-light)] italic">
                              # {flag.toLowerCase().replace(/_/g, " ")}
                            </span>
                          ))}
                          {(!d.aiDecision?.fraudFlags || d.aiDecision.fraudFlags.length === 0) && <span className="text-[10px] text-[var(--color-steel)]">High amount threshold trigger</span>}
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end text-right">
                    <div>
                       <div className="text-[10px] font-black uppercase text-[var(--color-steel)]">Source Hash</div>
                       <div className="font-mono text-[10px] text-[var(--color-steel)]">{d._id}</div>
                       <div className="text-[11px] text-[var(--color-steel)] mt-1">{new Date(d.createdAt).toLocaleDateString("en-IN")}</div>
                    </div>
                    <div className="flex gap-2 w-full mt-4">
                       <button 
                         className="btn btn-ghost flex-1 py-3 border-2 border-[var(--color-paper-alt)] text-xs font-black uppercase tracking-widest hover:bg-[var(--color-paper-alt)]"
                         onClick={() => handleAction(d._id, 'reject')}
                         disabled={actionLoading}
                       >
                         BLOCK
                       </button>
                       <button 
                         className="btn btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                         onClick={() => handleAction(d._id, 'approve')}
                         disabled={actionLoading}
                       >
                         CLEAR FUNDS
                       </button>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
