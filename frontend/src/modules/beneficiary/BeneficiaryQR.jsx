import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import api from "../../services/api";

export default function BeneficiaryQR() {
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600 seconds)
  const navigate = useNavigate();

  const generateToken = async () => {
    const params = new URLSearchParams(window.location.search);
    const walletId = params.get("walletId");

    setLoading(true); setError("");
    try {
      const res = await api.post("/wallet/qr", { walletId });
      const tokenData = res.data?.data || res.data;
      setQrToken(tokenData.qrToken);
      setTimeLeft(600); // Reset timer to 10 minutes
    } catch (err) {
      if (err.response?.status === 404) {
        setError("You do not have an active wallet for this mission.");
      } else {
        setError(err.response?.data?.message || "Failed to generate security token.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateToken();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!qrToken || timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [qrToken, timeLeft]);

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading && !qrToken) return <div className="loader-center"><div className="spinner" /><span>Generating secure token...</span></div>;

  return (
    <div className="stack-lg" style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center", paddingTop: "var(--space-8)" }}>
      {/* Back button */}
      <div style={{ textAlign: "left" }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">← Back to Wallet</button>
      </div>

      <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
        <h1 className="page-title">Payment QR Token</h1>
        <p className="page-subtitle">Show this dynamic QR code to a registered merchant to pay for authorized supplies.</p>
      </div>

      {error ? (
        <div className="alert alert-danger" style={{ textAlign: "left" }}>{error}</div>
      ) : (
        <div className="card qr-container stack" style={{ padding: "var(--space-8)", position: "relative", overflow: "hidden" }}>
          
          {/* Animated scanning line effect over the QR wrapper */}
          <div style={{ position: "relative", padding: "16px", background: "white", borderRadius: "16px", boxShadow: "var(--shadow-lg)" }}>
            {timeLeft > 0 ? (
              <QRCode 
                value={qrToken} 
                size={220}
                level="H" 
                fgColor="#15181D" 
              />
            ) : (
              <div style={{ width: 220, height: 220, background: "var(--color-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "var(--color-text-muted)", borderRadius: "var(--radius)" }}>
                 <div style={{ fontSize: "32px", marginBottom: "8px" }}>⌛</div>
                 <div style={{ fontWeight: "700" }}>Token Expired</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "var(--space-4)" }}>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Secure Token Expires In
            </div>
            <div className={`qr-expiry ${timeLeft < 60 ? 'text-[var(--color-alert)] animate-pulse' : 'text-[var(--color-ink)]'}`} style={{ fontSize: "32px", fontWeight: "900", fontFamily: "monospace", margin: "4px 0" }}>
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="row" style={{ gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <button 
              className="btn btn-primary" 
              onClick={generateToken} 
              disabled={loading}
              style={{ flex: 1 }}
            >
              Regenerate QR
            </button>
            <Link to="/beneficiary" className="btn btn-ghost" style={{ flex: 1 }}>
              Done
            </Link>
          </div>

          {/* Security badge overlay */}
          <div style={{ position: "absolute", top: "16px", right: "16px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px", background: "var(--color-verified-light)", color: "var(--color-verified-dark)", padding: "4px 10px", borderRadius: "12px" }}>
            <span>🔒</span> JWT Signed
          </div>
        </div>
      )}
      
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
        <strong>Security Notice:</strong> Do not screenshot this QR code. It is cryptographically signed and expires automatically to prevent theft. Merchant scanners verify the signature instantly.
      </p>
    </div>
  );
}
