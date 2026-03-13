import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr"; // using jsQR for lightweight robust scanning
import api from "../../services/api";

export default function MerchantScan() {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const scanningRef = useRef(true);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  const handleScan = async (qrTokenData) => {
    setScanning(false);
    setProcessing(true);
    setError("");

    try {
      // Hit backend scan endpoint to verify JWT and get wallet info
      const res = await api.post("/payments/scan", { qrToken: qrTokenData });
      
      // Navigate to confirm payment screen with wallet payload
      navigate("/merchant/confirm", { state: { wallet: res.data, qrToken: qrTokenData } });
      
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired QR tag.");
      setProcessing(false);
    }
  };

  // Handle camera
  useEffect(() => {
    let stream = null;
    let rafId = null;
    let cancelled = false;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true); // required for iOS
          videoRef.current.play();
          rafId = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Camera access denied or unavailable. Please permit camera access to scan QRs.");
        setScanning(false);
      }
    };

    const tick = () => {
      if (cancelled) return;
      if (!videoRef.current || !scanningRef.current) return;

      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          handleScan(code.data);
          return; // Stop scanning once found
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="stack-lg" style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center", paddingTop: "var(--space-6)" }}>
      <div className="page-header">
        <h1 className="page-title">Scan Beneficiary Wallet</h1>
        <p className="page-subtitle">Align the QR code within the frame to verify the aid wallet policy and initiate payment.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", background: "#000", position: "relative", minHeight: "400px" }}>
        {error ? (
           <div style={{ padding: "var(--space-6)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
              <div style={{ fontSize: "32px", marginBottom: "var(--space-4)" }}>⚠️</div>
              <p style={{ color: "var(--color-danger)" }}>{error}</p>
              <button className="btn btn-primary" onClick={() => { setError(""); setScanning(true); }} style={{ marginTop: "var(--space-6)" }}>
                Try Again
              </button>
           </div>
        ) : processing ? (
          <div style={{ padding: "var(--space-6)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", gap: "var(--space-4)" }}>
             <div className="spinner" style={{ borderColor: "#333", borderTopColor: "var(--color-primary)", margin: "0 auto" }} />
             <p>Verifying secure token + policy…</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Scan overlay frame */}
            <div style={{ position: "absolute", border: "2px solid rgba(14,165,233,0.5)", width: "250px", height: "250px", top: "50%", left: "50%", transform: "translate(-50%, -50%)", borderRadius: "24px", boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
            
            <div style={{ position: "absolute", bottom: "16px", left: "0", right: "0", color: "white", fontSize: "12px", background: "rgba(0,0,0,0.6)", padding: "10px", margin: "0 24px", borderRadius: "8px", backdropFilter: "blur(4px)" }}>
              Scanning via jsQR... Hold device steady. Token signatures are verified live.
            </div>
          </>
        )}
      </div>
      
      <div>
         <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  );
}
