import { useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function ScanQR() {
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = () => {
    setLoading(true);
    api.post("/payments/initiate", { qrData })
      .then(res => setResult(res.data))
      .catch(() => alert("Invalid or expired QR"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-xl font-bold">Scan Merchant QR</h2>

      <input
        placeholder="Paste QR payload (demo)"
        value={qrData}
        onChange={e => setQrData(e.target.value)}
        className="border p-2 w-full"
      />

      <button
        onClick={handleScan}
        className="btn-primary w-full"
      >
        Scan & Validate
      </button>

      {loading && <Loader text="Validating payment..." />}

      {result && (
        <div className="bg-green-100 p-4 rounded">
          <p>Merchant: {result.merchantName}</p>
          <p>Amount: ₹{result.amount}</p>

          <button
            onClick={() =>
              api.post("/payments/confirm", { paymentId: result.paymentId })
                .then(() => alert("Payment successful"))
            }
            className="btn-primary mt-3"
          >
            Confirm Payment
          </button>
        </div>
      )}
    </div>
  );
}
