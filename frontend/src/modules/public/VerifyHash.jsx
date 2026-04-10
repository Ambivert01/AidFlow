import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";

export default function VerifyHash() {
  const [searchParams] = useSearchParams();
  const initialHash = searchParams.get("hash") || "";
  
  const [hash, setHash] = useState(initialHash);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!hash) return;
    
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.get(`/public/audit/verify/${hash}`);
      const d = res.data?.data || res.data;
      setResult({
        isValid: !!(d.auditTrail?.length),
        timestamp: d.auditTrail?.[0]?.createdAt,
        merkleRoot: d.merkleRoot,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. The hash could not be validated against the network.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if query param exists on load
  useEffect(() => {
    if (initialHash) {
      handleVerify();
    }
  }, [initialHash]);

  return (
    <div className="center-page" style={{ padding: "var(--space-6)" }}>
      <div className="card shadow-lg stack-lg" style={{ maxWidth: "500px", width: "100%", padding: "var(--space-8)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
           <div style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>⛓️</div>
           <h1 style={{ fontSize: "24px", fontWeight: "800" }}>Blockchain Verification</h1>
           <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
             Cryptographically prove that a specific AidFlow event occurred precisely as logged, without relying on central database trust.
           </p>
        </div>

        <form onSubmit={handleVerify} className="stack">
           <input
             type="text"
             className="form-input"
             style={{ fontFamily: "monospace", padding: "16px" }}
             placeholder="0x..."
             value={hash}
             onChange={e => setHash(e.target.value)}
             required
           />
           <button type="submit" className="btn btn-primary" disabled={loading}>
             {loading ? "Verifying Ledger..." : "Check Hash Validity"}
           </button>
        </form>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: "var(--space-4)" }}>
            <strong>Verification Failed</strong>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>{error}</p>
          </div>
        )}

        {result && (
          <div style={{ marginTop: "var(--space-6)", padding: "var(--space-4)", background: result.isValid ? "var(--color-success-light)" : "var(--color-danger-light)", borderRadius: "var(--radius)", border: `1px solid ${result.isValid ? "var(--color-success)" : "var(--color-danger)"}` }}>
             <div className="row" style={{ gap: "8px", marginBottom: "var(--space-2)" }}>
                <span style={{ fontSize: "24px" }}>{result.isValid ? "✅" : "❌"}</span>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: result.isValid ? "var(--color-success-dark)" : "var(--color-danger-dark)" }}>
                  {result.isValid ? "Cryptographically Verified" : "Verification Failed"}
                </h3>
             </div>
             
             {result.isValid && (
               <div className="stack" style={{ gap: "8px", fontSize: "12px", color: "var(--color-success-dark)" }}>
                  <div><strong>Status:</strong> The hash exists unaltered on the network.</div>
                  <div><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</div>
                  <div style={{ wordBreak: "break-all", background: "rgba(255,255,255,0.5)", padding: "8px", borderRadius: "4px", fontFamily: "monospace" }}>
                    {result.merkleRoot}
                  </div>
               </div>
             )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
           <Link to="/public-audit" className="btn btn-ghost btn-sm">← Back to Ledger</Link>
        </div>
      </div>
    </div>
  );
}
