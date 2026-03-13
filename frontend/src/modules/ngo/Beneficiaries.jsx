import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Beneficiaries({ campaignId }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/ngo/beneficiaries", {
        params: { campaignId },
      });
      setBeneficiaries(res.data);
    } catch (e) {
      console.error("Failed to load beneficiaries", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) load();
  }, [campaignId]);

  const overrideDecision = async (id, decision) => {
    const reason = prompt(`Enter reason for ${decision}:`);
    if (!reason) return;

    try {
      if (decision === "APPROVE") {
        await api.post(`/ngo/beneficiaries/${id}/approve`, { reason });
      } else {
        await api.post(`/ngo/beneficiaries/${id}/reject`, { reason });
      }
      await load();
    } catch {
      alert("Action failed. Check console for details.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading beneficiary pool...</div>;

  return (
    <div className="stack-md">
      <div className="row-between">
        <h3 className="font-bold text-slate-800">Beneficiary Cohort ({beneficiaries.length})</h3>
        <button className="btn btn-ghost btn-xs" onClick={load}>Refresh Pool</button>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
          <p className="text-slate-400 text-sm">No beneficiaries registered for this mission yet.</p>
        </div>
      ) : (
        <div className="grid-1 gap-4">
          {beneficiaries.map((b) => (
            <div key={b._id} className="card p-4 border-slate-100 hover:border-primary-light transition-colors">
              <div className="row-between items-start">
                <div className="flex gap-4">
                  <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                    {b.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{b.name || "Unnamed Beneficiary"}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{b._id}</div>
                  </div>
                </div>
                <span className={`badge ${
                  b.status === 'ACTIVE' || b.status === 'ELIGIBLE' ? 'badge-green' : 
                  b.status === 'MANUAL_REVIEW' ? 'badge-yellow' : 'badge-red'
                }`}>{b.status}</span>
              </div>

              {/* AI SIGNAL GRID */}
              <div className="grid-3 gap-4 mt-6 p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Vulnerability</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${b.vulnerabilityScore}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{b.vulnerabilityScore}/100</span>
                  </div>
                </div>
                
                {b.aiDecision && (
                  <>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">AI Eligibility</div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${b.aiDecision.eligibilityConfidence > 0.7 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                               style={{ width: `${b.aiDecision.eligibilityConfidence * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{Math.round(b.aiDecision.eligibilityConfidence * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Fraud Risk</div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${b.aiDecision.fraudRisk > 40 ? 'bg-red-500' : 'bg-green-500'}`} 
                               style={{ width: `${b.aiDecision.fraudRisk}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{b.aiDecision.fraudRisk}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ACTIONS */}
              {(b.status === "REGISTERED" || b.status === "MANUAL_REVIEW" || b.status === "AI_EVALUATED") && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                   <button 
                    onClick={() => overrideDecision(b._id, "APPROVE")}
                    className="btn btn-primary btn-xs"
                  >Approve & Activate</button>
                   <button 
                    onClick={() => overrideDecision(b._id, "REJECT")}
                    className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50"
                  >Reject Candidate</button>
                </div>
              )}

              {b.overrideByNgo?.decision && (
                <div className="mt-4 p-2 bg-blue-50 text-[11px] text-blue-700 rounded border border-blue-100">
                  <strong>NGO Decision:</strong> {b.overrideByNgo.decision} — {b.overrideByNgo.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
