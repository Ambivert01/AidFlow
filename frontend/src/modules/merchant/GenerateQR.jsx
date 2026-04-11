import { useState } from "react";
import api from "../../services/api";
import { QRCodeCanvas } from "qrcode.react";

export default function GenerateQR() {
  const [payload, setPayload] = useState(null);
  const [amount, setAmount] = useState("");

  const generate = async () => {
    // Merchants don't generate QR — beneficiaries do via /wallet/qr
    // This component is a demo helper only
    setPayload(`DEMO_QR_${Date.now()}_amount_${amount}`);
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-3">
      <h3 className="font-semibold">Generate Payment QR</h3>

      <input
        type="number"
        placeholder="Amount"
        className="border p-2 w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={generate}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Generate QR
      </button>

      {payload && (
        <>
          <QRCodeCanvas value={payload} size={180} />

          <textarea
            className="border p-2 w-full text-xs"
            rows={4}
            readOnly
            value={payload}
          />

          <button
            onClick={() => navigator.clipboard.writeText(payload)}
            className="bg-gray-800 text-white px-3 py-1 rounded"
          >
            Copy Payload
          </button>

          <p className="text-xs text-gray-500">
            Share this payload with beneficiary (demo mode)
          </p>
        </>
      )}
    </div>
  );
}
