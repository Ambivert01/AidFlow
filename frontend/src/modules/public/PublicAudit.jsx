import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../components/toastContext";

export default function PublicAudit() {
  const [searchParams] = useSearchParams();
  const [jobIdHash, setJobIdHash] = useState(searchParams.get("id") || "");
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!jobIdHash) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/public/audit/verify/${jobIdHash}`);
      const d = res.data?.data || res.data;
      setAuditData({
        jobIdHash: d.jobIdHash,
        auditFinalized: !!d.merkleRoot,
        merkleRoot: d.merkleRoot,
        blockchainTxHash: d.blockchainAnchor?.txHash,
        timeline: (d.auditTrail || []).map(log => ({
          label: log.eventType?.replaceAll("_", " "),
          timestamp: log.createdAt,
          actor: log.actor?.role || "SYSTEM",
          hash: log.hash,
          previousHash: log.previousHash,
          payload: log.payload,
        })),
      });
    } catch (err) {
      showToast(err.response?.data?.message || "Audit trail not found", "error");
      setAuditData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack-lg animate-fade-up">
      <div className="page-header" style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
         <h1 className="page-title">Immutable Public Ledger</h1>
         <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0 auto" }}>
            Enter a transaction hash or Job ID below to view the entire cryptographic lifecycle of a donation—from inception to final settlement.
         </p>
      </div>

      <div className="card shadow-lg" style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-6)" }}>
         <form onSubmit={handleSearch} className="row" style={{ gap: "var(--space-2)" }}>
           <input
             type="text"
             className="form-input"
             style={{ flex: 1, fontFamily: "monospace" }}
             placeholder="Enter Hex Hash (e.g. 5f8d...a3)"
             value={jobIdHash}
             onChange={e => setJobIdHash(e.target.value)}
             required
           />
           <button type="submit" className="btn btn-primary" disabled={loading}>
             {loading ? "Searching..." : "Lookup Ledger"}
           </button>
         </form>
         <div style={{ marginTop: "var(--space-4)", textAlign: "center", fontSize: "12px", color: "var(--color-text-faint)" }}>
           Every entry below is chained to the one before it — tamper with any link and the chain breaks visibly.
         </div>
      </div>

      {loading ? (
        <div className="stack-md">
           <div className="skeleton" style={{ height: "40px", width: "300px" }} />
           <div className="card shadow-md stack-md p-6">
              <div className="skeleton" style={{ height: "24px", width: "50%" }} />
              <div className="skeleton" style={{ height: "16px", width: "30%" }} />
              <div className="stack-sm mt-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="skeleton" style={{ height: "80px", width: "100%" }} />
                 ))}
              </div>
           </div>
        </div>
      ) : auditData && (
        <div className="card shadow-md stack-lg mt-8">
            <div className="row-between" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-4)" }}>
               <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800" }}>Audit Trace: {auditData.jobIdHash}</h2>
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                 <span className={auditData.auditFinalized ? "stamp" : "stamp stamp-ink"} style={{ opacity: auditData.auditFinalized ? 1 : 0.55 }}>
                   {auditData.auditFinalized ? "✓ Anchored on-chain" : "○ Pending finalization"}
                 </span>
                 {auditData.auditFinalized && auditData.blockchainTxHash && (
                   <a
                     href={`https://etherscan.io/tx/${auditData.blockchainTxHash}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="btn btn-ghost btn-sm"
                   >
                     View transaction ↗
                   </a>
                 )}
               </div>
            </div>

            <div className="timeline" style={{ paddingLeft: "16px", borderLeft: "2px solid var(--color-border)", margin: "var(--space-6) 0" }}>
               {auditData.timeline.map((event, i) => (
                 <div key={i} style={{ position: "relative", marginBottom: "var(--space-6)", paddingLeft: "var(--space-4)" }}>
                    {/* Timeline Dot */}
                    <div style={{ position: "absolute", left: "-23px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: i === 0 ? "var(--color-success)" : "var(--color-primary)", border: "2px solid var(--color-surface)" }} />
                    
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px", fontWeight: "600" }}>
                      {new Date(event.timestamp).toLocaleString()} • {event.actor}
                    </div>
                    <div style={{ background: "var(--color-surface-alt)", padding: "16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                       <div className="row-between mb-2">
                          <p style={{ fontWeight: "700", fontSize: "14px" }}>{event.label}</p>
                          <span style={{ fontSize: "10px", color: "var(--color-text-faint)", fontFamily: "monospace" }}>Seq: {i}</span>
                       </div>
                       
                       {/* Cryptographic Proof Piece */}
                       <div style={{ marginBottom: "12px", padding: "8px", background: "var(--color-surface)", borderRadius: "4px", borderLeft: "3px solid var(--color-primary-light)" }}>
                          <div style={{ fontSize: "9px", color: "var(--color-text-faint)", textDecoration: "uppercase", marginBottom: "2px" }}>Cryptographic Hash</div>
                          <div style={{ fontSize: "10px", fontFamily: "monospace", wordBreak: "break-all", color: "var(--color-primary)" }}>{event.hash}</div>
                       </div>

                       {event.previousHash && (
                         <div style={{ marginBottom: "12px", padding: "4px 8px", fontSize: "10px", color: "var(--color-text-faint)", fontFamily: "monospace" }}>
                           ↑ Linked to: {event.previousHash.slice(0, 32)}...
                         </div>
                       )}
                       
                       {/* Merkle Root if Finalized */}
                       {i === auditData.timeline.length - 1 && auditData.merkleRoot && (
                         <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <span className="stamp" style={{ fontSize: "10px" }}>Sealed</span>
                            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", wordBreak: "break-all" }}>
                              Global Merkle Root: {auditData.merkleRoot}
                            </span>
                         </div>
                       )}
                    </div>
                 </div>
               ))}
            </div>
        </div>
      )}

    </div>
  );
}
