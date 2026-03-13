import { useState } from "react";
import api from "../../services/api";

export default function ScanQR() {
  const [qrData, setQrData] = useState("");
  const [preview, setPreview] = useState(null);

  const scan = async () => {
    const res = await api.post("/payments/scan", { qrToken: qrData });
    setPreview(res.data);
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-3">
      <h3 className="font-semibold">Scan Merchant QR</h3>

      <textarea
        className="border p-2 w-full"
        rows={4}
        placeholder="Paste QR payload here"
        value={qrData}
        onChange={(e) => setQrData(e.target.value)}
      />

      <button
        onClick={scan}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Scan
      </button>

      {preview && (
        <div className="border p-3 rounded bg-gray-50">
          <p><b>Wallet:</b> {preview.walletId?.slice(-8)}</p>
          <p><b>Allowed categories:</b> {(preview.allowedCategories || []).join(", ")}</p>
          <p><b>Max per transaction:</b> ₹{preview.maxPerTransaction}</p>
          <p><b>Balance:</b> ₹{preview.balance}</p>
        </div>
      )}
    </div>
  );
}
