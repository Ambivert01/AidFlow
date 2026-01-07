import { useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function ScanQR() {
  const [qrData, setQrData] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    try {
      const res = await api.post("/payments/scan", { qrData });
      setPreview(res.data);
    } catch {
      alert("Invalid / expired QR");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    try {
      await api.post("/payments/confirm", {
        walletId: preview.walletId,
        merchantId: preview.merchantId,
        amount: preview.amount,
        category: preview.category,
      });
      alert("Payment successful");
      setPreview(null);
      setQrData("");
    } catch (e) {
      alert(e.response?.data?.message || "Payment failed");
    }
  };

  return (
    <div className="bg-white p-5 rounded shadow max-w-md">
      <h2 className="text-lg font-semibold mb-3">Scan Merchant QR</h2>

      <input
        placeholder="Paste QR payload"
        value={qrData}
        onChange={(e) => setQrData(e.target.value)}
        className="border p-2 w-full mb-3"
      />

      <button onClick={scan} className="btn-primary w-full">
        Scan
      </button>

      {loading && <Loader text="Validating..." />}

      {preview && (
        <div className="bg-green-50 p-4 rounded mt-4">
          <p><b>Merchant:</b> {preview.merchantName}</p>
          <p><b>Category:</b> {preview.category}</p>
          <p><b>Amount:</b> ₹{preview.amount}</p>

          <button
            onClick={confirm}
            className="btn-primary w-full mt-3"
          >
            Confirm Payment
          </button>
        </div>
      )}
    </div>
  );
}
