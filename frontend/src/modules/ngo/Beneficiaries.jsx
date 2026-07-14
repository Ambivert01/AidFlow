import { useEffect, useState } from "react";
import api from "../../services/api";
import { confirmDialog } from "../../components/ConfirmDialog";
import { useToast } from "../../components/toastContext";

export default function Beneficiaries({ campaignId }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const load = async () => {
    try {
      const res = await api.get("/ngo/beneficiaries", {
        params: { campaignId },
      });
      const payload = res.data?.data || res.data;
      setBeneficiaries(payload?.beneficiaries || payload || []);
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
    const reason = await confirmDialog(
      `You're about to ${decision === "APPROVE" ? "approve" : "reject"} this beneficiary, overriding the AI's recommendation.`,
      {
        title: `Override to ${decision}`,
        input: true,
        inputLabel: "Reason for override",
        inputPlaceholder: "Explain why you're overriding the AI decision...",
        confirmLabel: decision === "APPROVE" ? "Approve" : "Reject",
        danger: decision !== "APPROVE",
      },
    );
    if (!reason) return;

    try {
      if (decision === "APPROVE") {
        await api.post(`/ngo/beneficiaries/${id}/approve`, { reason });
      } else {
        await api.post(`/ngo/beneficiaries/${id}/reject`, { reason });
      }
      await load();
    } catch {
      showToast("Action failed. Please try again.", "error");
    }
  };

  if (loading) return <div className="p-8 text-center text-[var(--color-steel)]">Loading beneficiary pool...</div>;

  return (
    <div className="stack-md">
      <div className="row-between">
        <h3 className="font-bold text-[var(--color-ink)]">Beneficiary Cohort ({beneficiaries.length})</h3>
        <button className="btn btn-ghost btn-xs" onClick={load}>Refresh Pool</button>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-[var(--color-paper-alt)] rounded-xl">
          <p className="text-[var(--color-steel)] text-sm">No beneficiaries registered for this mission yet.</p>
        </div>
      ) : (
        <div className="grid-1 gap-4">
          {beneficiaries.map((b) => (
            <div key={b._id} className="card p-4 border-[var(--color-paper-alt)] hover:border-primary-light transition-colors">
              <div className="row-between items-start">
                <div className="flex gap-4">
                  <div className="h-10 w-10 bg-[var(--color-paper-alt)] rounded-full flex items-center justify-center font-bold text-[var(--color-steel)]">
                    {b.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--color-ink)]">{b.name || "Unnamed Beneficiary"}</div>
                    <div className="text-[11px] text-[var(--color-steel)] font-mono">{b._id}</div>
                  </div>
                </div>
                <span className={`badge ${
                  b.status === 'ACTIVE' || b.status === 'ELIGIBLE' ? 'badge-green' : 
                  b.status === 'MANUAL_REVIEW' ? 'badge-yellow' : 'badge-red'
                }`}>{b.status}</span>
              </div>

              {/* AI SIGNAL GRID */}
              <div className="grid-3 gap-4 mt-6 p-3 bg-[var(--color-paper-alt)] rounded-lg">
                <div>
                  <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold mb-1">Vulnerability</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-[var(--color-paper-alt)] rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--color-signal)]" style={{ width: `${b.vulnerabilityScore}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[var(--color-ink)]">{b.vulnerabilityScore}/100</span>
                  </div>
                </div>
                
                {b.aiDecision && (
                  <>
                    <div>
                      <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold mb-1">AI Eligibility</div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-[var(--color-paper-alt)] rounded-full overflow-hidden">
                          <div className={`h-full ${b.aiDecision.eligibilityConfidence > 0.7 ? 'bg-[var(--color-verified)]' : 'bg-[var(--color-caution)]'}`} 
                               style={{ width: `${b.aiDecision.eligibilityConfidence * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-ink)]">{Math.round(b.aiDecision.eligibilityConfidence * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-steel)] uppercase font-bold mb-1">Fraud Risk</div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-[var(--color-paper-alt)] rounded-full overflow-hidden">
                          <div className={`h-full ${b.aiDecision.fraudRisk > 40 ? 'bg-[var(--color-alert)]' : 'bg-[var(--color-verified)]'}`} 
                               style={{ width: `${b.aiDecision.fraudRisk}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-ink)]">{b.aiDecision.fraudRisk}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ACTIONS */}
              {(b.status === "PENDING" || b.status === "UNDER_REVIEW" || b.status === "MANUAL_REVIEW") && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--color-paper-alt)]">
                   <button 
                    onClick={() => overrideDecision(b._id, "APPROVE")}
                    className="btn btn-primary btn-xs"
                  >Approve & Activate</button>
                   <button 
                    onClick={() => overrideDecision(b._id, "REJECT")}
                    className="btn btn-ghost btn-xs text-[var(--color-alert)] hover:bg-[var(--color-alert-light)]"
                  >Reject Candidate</button>
                </div>
              )}

              {b.overrideByNgo?.decision && (
                <div className="mt-4 p-2 bg-[var(--color-signal-light)] text-[11px] text-[var(--color-signal-dark)] rounded border border-[var(--color-signal-light)]">
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
