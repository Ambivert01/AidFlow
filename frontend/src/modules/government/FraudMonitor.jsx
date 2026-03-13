import { useEffect, useState } from "react";
import api from "../../services/api";

export default function FraudMonitor() {
  const [data, setData] = useState({ frozenWallets: [], merchantViolations: [], suspiciousDonations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get("/government/fraud-alerts");
        setData(res.data);
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
            <p className="page-subtitle text-slate-500">Real-time network oversight. Monitoring for policy drift and institutional corruption.</p>
          </div>
          <div className="flex gap-2">
             <span className="badge bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-xs">AI-AGENT: ACTIVE</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">⚠️ {error}</div>}

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
        {/* Merchant Violations - Critical Feed */}
        <div className="lg:col-span-8 stack gap-4">
          <div className="card shadow-md border-0 border-t-4 border-red-600">
            <div className="p-6">
               <div className="row-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Merchant Violations</h2>
                    <p className="text-xs text-slate-500 mt-1">Attempts to process aid outside manifest categories.</p>
                  </div>
                  <span className="badge badge-error tabular-nums bg-red-600 text-white font-black px-2 py-1 rounded">
                    {data.merchantViolations?.length || 0} ALERTS
                  </span>
               </div>
               
               {data.merchantViolations?.length === 0 ? (
                 <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No policy drift detected</p>
                 </div>
               ) : (
                  <div className="divide-y divide-slate-100">
                    {data.merchantViolations.map((v, i) => (
                      <div key={i} className="py-4 row-between hover:bg-slate-50 transition-colors px-2 rounded-lg">
                         <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl shadow-inner font-bold italic">!</div>
                            <div>
                               <div className="font-black text-slate-800 text-sm">Merchant #{v.payload?.merchantId?.slice(-6).toUpperCase()}</div>
                               <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                 {new Date(v.timestamp).toLocaleString("en-IN")}
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-[10px] font-black uppercase text-red-600 tracking-tighter mb-1">REASON: {v.payload?.reason || v.description}</div>
                            <div className="text-[11px] font-mono text-slate-500">Wallet Ref: {v.payload?.walletId?.slice(-8)}</div>
                         </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
          </div>

          <div className="card shadow-md border-0 border-t-4 border-slate-800">
            <div className="p-6">
               <div className="row-between mb-6">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Institutional Asset Freeze</h2>
                  <span className="badge bg-slate-900 text-white font-black px-2 py-1 rounded text-xs tabular-nums">
                    {data.frozenWallets?.length || 0} BLOCKED
                  </span>
               </div>
               {data.frozenWallets?.length === 0 ? (
                 <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No assets frozen</p>
                 </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.frozenWallets.map(w => (
                      <div key={w._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group overflow-hidden">
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">❄️</div>
                         <div className="text-[10px] font-black text-slate-400 mb-1">Beneficiary: {w.beneficiary?.name}</div>
                         <div className="text-xl font-black text-slate-900 mb-3 tabular-nums">₹{w.balance.toLocaleString("en-IN")}</div>
                         <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>ID: {w._id.slice(-6)}</span>
                            <span className="text-red-500">CLOSED BY GOVT</span>
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
          <div className="card shadow-md border-0 bg-slate-900 text-white">
            <div className="p-6">
               <div className="row-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">AI Watchlist</h2>
                  <span className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></span>
               </div>
               <p className="text-xs text-slate-500 mb-6 leading-relaxed">
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
                          <span className="font-mono text-[10px] text-slate-400">TXN:{d._id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] font-black text-orange-400">{d.riskData?.fraudRiskScore || "MED"} RISK</span>
                       </div>
                       <div className="text-lg font-black tabular-nums">₹{d.amount.toLocaleString("en-IN")}</div>
                       <div className="text-[8px] mt-2 opacity-50 font-black uppercase tracking-tighter">FLAG: {d.riskData?.fraudFlags?.[0] || "VELOCITY_LIMIT"}</div>
                    </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="card shadow-md border-0 p-6 bg-slate-50 border-2 border-slate-100 italic">
             <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Notice of Authority</h4>
             <p className="text-[10px] text-slate-500 leading-relaxed">
               All actions taken on this dashboard are recorded to the immutable institutional ledger. Cryptographic proof of your intervention is stored in the blockchain anchor.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
