import { useEffect, useState } from "react";
import api from "../../services/api";

export default function FraudMonitor() {
  const [data, setData] = useState({ frozenWallets: [], merchantViolations: [], suspiciousDonations: [], otherAlerts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/government/fraud-alerts");
        const d = res.data?.data || res.data || {};
        // Backend returns array of FraudAlert docs — shape for UI
        const alerts = Array.isArray(d) ? d : [];
        const CATEGORIZED = ["WALLET_ABUSE", "MERCHANT_COLLUSION", "SUSPICIOUS_TRANSACTION", "DONATION_LAUNDERING", "AI_ANOMALY"];
        setData({
          frozenWallets: alerts.filter(a => a.alertType === "WALLET_ABUSE" || a.automatedActions?.walletFrozen),
          merchantViolations: alerts.filter(a => a.alertType === "MERCHANT_COLLUSION" || a.alertType === "SUSPICIOUS_TRANSACTION"),
          suspiciousDonations: alerts.filter(a => a.alertType === "DONATION_LAUNDERING" || a.alertType === "AI_ANOMALY"),
          // DUPLICATE_BENEFICIARY, PROOF_MANIPULATION, GEO_VIOLATION, OTHER -
          // these are real alertType values that don't fit the 3 thematic
          // buckets above. Previously they were silently dropped from this
          // surveillance dashboard entirely.
          otherAlerts: alerts.filter(a => !CATEGORIZED.includes(a.alertType)),
        });
      } catch {
        setError("Failed to load fraud analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"></div><p>Scanning Network for Anomalies...</p></div>;

  return (
    <div className="stack-lg">
      <div className="page-header border-b pb-6">
        <div className="row-between">
          <div>
            <h1 className="page-title text-2xl font-black italic italic tracking-tighter">SURVEILLANCE & AML</h1>
            <p className="page-subtitle text-[var(--color-steel)]">Real-time network oversight. Monitoring for policy drift and institutional corruption.</p>
          </div>
          <div className="flex gap-2">
             <span className="badge bg-[var(--color-paper-alt)] text-[var(--color-ink)] font-bold px-3 py-1 rounded-full text-xs">AI-AGENT: ACTIVE</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger bg-[var(--color-alert-light)] text-[var(--color-alert-dark)] p-4 rounded-xl border border-[var(--color-alert-light)] mb-6">⚠️ {error}</div>}

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
        {/* Merchant Violations - Critical Feed */}
        <div className="lg:col-span-8 stack gap-4">
          <div className="card shadow-md border-0 border-t-4 border-[var(--color-alert)]">
            <div className="p-6">
               <div className="row-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-[var(--color-ink)] uppercase tracking-widest">Merchant Violations</h2>
                    <p className="text-xs text-[var(--color-steel)] mt-1">Attempts to process aid outside manifest categories.</p>
                  </div>
                  <span className="badge badge-error tabular-nums bg-[var(--color-alert)] text-white font-black px-2 py-1 rounded">
                    {data.merchantViolations?.length || 0} ALERTS
                  </span>
               </div>
               
               {data.merchantViolations?.length === 0 ? (
                 <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-2xl border-2 border-dashed border-[var(--color-paper-alt)]">
                    <p className="text-sm font-bold text-[var(--color-steel)] uppercase tracking-widest">No policy drift detected</p>
                 </div>
               ) : (
                  <div className="divide-y divide-[var(--color-paper-alt)]">
                    {data.merchantViolations.map((v, i) => (
                      <div key={i} className="py-4 row-between hover:bg-[var(--color-paper-alt)] transition-colors px-2 rounded-lg">
                         <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-[var(--color-alert-light)] text-[var(--color-alert)] rounded-xl flex items-center justify-center text-xl shadow-inner font-bold italic">!</div>
                            <div>
                               <div className="font-black text-[var(--color-ink)] text-sm">Merchant #{v.payload?.merchantId?.slice(-6).toUpperCase()}</div>
                               <div className="text-[10px] text-[var(--color-steel)] font-mono mt-0.5">
                                 {new Date(v.timestamp).toLocaleString("en-IN")}
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-[10px] font-black uppercase text-[var(--color-alert)] tracking-tighter mb-1">REASON: {v.payload?.reason || v.description}</div>
                            <div className="text-[11px] font-mono text-[var(--color-steel)]">Wallet Ref: {v.payload?.walletId?.slice(-8)}</div>
                         </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
          </div>

          <div className="card shadow-md border-0 border-t-4 border-[var(--color-ink)]">
            <div className="p-6">
               <div className="row-between mb-6">
                  <h2 className="text-lg font-black text-[var(--color-ink)] uppercase tracking-widest">Institutional Asset Freeze</h2>
                  <span className="badge bg-[var(--color-ink)] text-white font-black px-2 py-1 rounded text-xs tabular-nums">
                    {data.frozenWallets?.length || 0} BLOCKED
                  </span>
               </div>
               {data.frozenWallets?.length === 0 ? (
                 <div className="py-12 text-center bg-[var(--color-paper-alt)] rounded-2xl border-2 border-dashed border-[var(--color-paper-alt)]">
                    <p className="text-sm font-bold text-[var(--color-steel)] uppercase tracking-widest">No assets frozen</p>
                 </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.frozenWallets.map(w => (
                      <div key={w._id} className="p-4 bg-[var(--color-paper-alt)] rounded-2xl border border-[var(--color-paper-alt)] relative group overflow-hidden">
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">❄️</div>
                         <div className="text-[10px] font-black text-[var(--color-steel)] mb-1">Beneficiary: {w.beneficiary?.name}</div>
                         <div className="text-xl font-black text-[var(--color-ink)] mb-3 tabular-nums">₹{w.balance.toLocaleString("en-IN")}</div>
                         <div className="flex justify-between items-center text-[9px] font-bold text-[var(--color-steel)] uppercase tracking-widest">
                            <span>ID: {w._id.slice(-6)}</span>
                            <span className="text-[var(--color-alert)]">CLOSED BY GOVT</span>
                         </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
          </div>
        </div>

        {/* AI Suspicious Queue - Sidebar */}
        <div className="lg:col-span-4 stack gap-4">
          <div className="card shadow-md border-0 bg-[var(--color-ink)] text-white">
            <div className="p-6">
               <div className="row-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-steel)]">AI Watchlist</h2>
                  <span className="animate-pulse w-2 h-2 bg-[var(--color-verified)] rounded-full"></span>
               </div>
               <p className="text-xs text-[var(--color-steel)] mb-6 leading-relaxed">
                 Real-time ingestion of donations flagged <span className="text-white font-bold">\"ALLOW_WITH_MONITORING\"</span>. Pattern recognition is active.
               </p>
               
               <div className="stack gap-3">
                 {(data.suspiciousDonations || []).length === 0 ? (
                    <div className="text-center py-8 opacity-20">
                       <p className="text-xs font-bold uppercase tracking-widest">No anomalies</p>
                    </div>
                 ) : data.suspiciousDonations.map(d => (
                    <div key={d._id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                       <div className="row-between mb-2">
                          <span className="font-mono text-[10px] text-[var(--color-steel)]">TXN:{d._id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] font-black text-[var(--color-signal)]">{d.riskData?.fraudRiskScore || "MED"} RISK</span>
                       </div>
                       <div className="text-lg font-black tabular-nums">₹{d.amount.toLocaleString("en-IN")}</div>
                       <div className="text-[8px] mt-2 opacity-50 font-black uppercase tracking-tighter">FLAG: {d.riskData?.fraudFlags?.[0] || "VELOCITY_LIMIT"}</div>
                    </div>
                 ))}
               </div>
            </div>
          </div>

          {data.otherAlerts?.length > 0 && (
            <div className="card shadow-md border-0 border-t-4 border-[var(--color-caution)]">
              <div className="p-6">
                <div className="row-between mb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-ink)]">Other Flags</h2>
                  <span className="badge bg-[var(--color-caution)] text-white font-black px-2 py-1 rounded text-xs tabular-nums">
                    {data.otherAlerts.length}
                  </span>
                </div>
                <div className="stack gap-2">
                  {data.otherAlerts.map((a) => (
                    <div key={a._id} className="p-3 bg-[var(--color-caution-light)] rounded-lg">
                      <div className="row-between">
                        <span className="text-[10px] font-black uppercase text-[var(--color-caution)] tracking-tighter">
                          {a.alertType?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-steel)]">
                          {new Date(a.createdAt || a.timestamp).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      {a.description && (
                        <p className="text-[11px] text-[var(--color-steel)] mt-1">{a.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="card shadow-md border-0 p-6 bg-[var(--color-paper-alt)] border-2 border-[var(--color-paper-alt)] italic">
             <h4 className="text-[10px] font-black uppercase text-[var(--color-steel)] mb-2">Notice of Authority</h4>
             <p className="text-[10px] text-[var(--color-steel)] leading-relaxed">
               All actions taken on this dashboard are recorded to the immutable institutional ledger. Cryptographic proof of your intervention is stored in the blockchain anchor.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
