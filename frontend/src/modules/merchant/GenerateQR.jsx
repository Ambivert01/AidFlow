import { useState } from "react";
import api from "../../services/api";

export default function GenerateQR() {
  const [amount, setAmount] = useState("");
  const [qr, setQr] = useState(null);

  const generate = () => {
    api.post("/payments/generate-qr", { amount })
      .then(res => setQr(res.data.qrPayload))
      .catch(() => alert("QR generation failed"));
  };

  return (
    <div className="bg-white p-5 rounded shadow max-w-md mt-6">
      <h2 className="text-lg font-semibold mb-3">Generate Payment QR</h2>

      <input
        type="number"
        placeholder="Enter amount"
        className="input w-full"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <button onClick={generate} className="btn-primary w-full mt-3">
        Generate QR
      </button>

      {qr && (
        <div className="mt-4 bg-gray-100 p-3 rounded text-sm break-all">
          <p className="font-medium">QR Payload (Demo):</p>
          {qr}
        </div>
      )}
    </div>
  );
}
