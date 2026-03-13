import { useEffect, useState } from "react";
import api from "../../services/api";

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
      setDonations(res.data);
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
    if (!window.confirm(`Are you sure you want to ${action.toUpperCase()} this high-risk donation?`)) return;
    
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
               <p className="page-subtitle text-slate-500">Manual government clearance required for donations exceeding safety thresholds.</p>
            </div>
            <div className="flex gap-2">
               <span className="badge badge-error bg-red-100 text-red-700 font-bold px-4 py-2 rounded-xl border border-red-200">
                 {donations.length} PENDING ACTION
               </span>
            </div>
         </div>
      </div>

      {error && <div className="alert alert-danger bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">⚠️ {error}</div>}
      {success && <div className="alert alert-success bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 mb-6">✅ {success}</div>}

      <div className="stack gap-6">
        {donations.length === 0 ? (
          <div className="card text-center py-24 bg-slate-50 border-dashed border-2">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-xl font-bold text-slate-800">System Clean</h2>
            <p className="max-w-md mx-auto text-slate-500 mt-2">All flagged financial flows have been cleared or blocked by the oversight authority.</p>
          </div>
        ) : (
          <div className="grid gap-4">
             {donations.map(d => (
               <div key={d._id} className="card shadow-sm hover:shadow-md transition-shadow grid md:grid-cols-[1fr_2fr_1.5fr] gap-6 p-6 border-l-4 border-red-500 bg-white">
                  <div className="stack gap-4">
                    <div>
                       <div className="text-[10px] font-black uppercase text-slate-400">Transaction Value</div>
                       <div className="text-3xl font-black text-slate-900 tabular-nums">₹{d.amount.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                       <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">AI Risk Evaluation</div>
                       <div className="row-between">
                          <span className={`font-black text-lg ${d.aiRiskScore > 90 ? 'text-red-600' : 'text-orange-500'}`}>{d.aiRiskScore}/100</span>
                          <span className="text-[8px] font-black uppercase bg-white px-2 py-1 rounded shadow-sm">CRITICAL</span>
                       </div>
                    </div>
                  </div>

                  <div className="stack gap-4 border-x border-slate-100 px-6">
                    <div>
                       <div className="text-[10px] font-black uppercase text-slate-400">Mission Target</div>
                       <div className="font-bold text-slate-800 truncate">{d.campaign?.title}</div>
                       <div className="text-[11px] text-slate-500">{d.campaign?.location?.state}, India</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Anomalies Detected</div>
                       <div className="flex flex-wrap gap-2">
                          {(d.aiRiskFlags || []).map(flag => (
                            <span key={flag} className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100 italic">
                              # {flag.toLowerCase().replace(/_/g, " ")}
                            </span>
                          ))}
                          {(!d.aiRiskFlags || d.aiRiskFlags.length === 0) && <span className="text-[10px] text-slate-400">High amount threshold trigger</span>}
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end text-right">
                    <div>
                       <div className="text-[10px] font-black uppercase text-slate-400">Source Hash</div>
                       <div className="font-mono text-[10px] text-slate-400">{d._id}</div>
                       <div className="text-[11px] text-slate-500 mt-1">{new Date(d.createdAt).toLocaleDateString("en-IN")}</div>
                    </div>
                    <div className="flex gap-2 w-full mt-4">
                       <button 
                         className="btn btn-ghost flex-1 py-3 border-2 border-slate-200 text-xs font-black uppercase tracking-widest hover:bg-slate-50"
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
