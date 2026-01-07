// src/modules/merchant/GenerateQR.jsx
import { useState } from "react";
import api from "../../services/api";

export default function GenerateQR() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [qr, setQr] = useState(null);

  const generate = async () => {
    try {
      const res = await api.post("/payments/generate-qr", {
        amount: Number(amount),
        category,
      });
      setQr(res.data.qrPayload);
    } catch {
      alert("QR generation failed");
    }
  };

  return (
    <div className="bg-white p-5 rounded shadow max-w-md">
      <h2 className="font-semibold mb-3">Generate Payment QR</h2>

      <input
        type="number"
        placeholder="Amount"
        className="input w-full mb-2"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <select
        className="input w-full mb-3"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="">Select Category</option>
        <option value="food">Food</option>
        <option value="medicine">Medicine</option>
        <option value="shelter">Shelter</option>
      </select>

      <button onClick={generate} className="btn-primary w-full">
        Generate QR
      </button>

      {qr && (
        <pre className="mt-4 bg-gray-100 p-3 text-xs break-all rounded">
          {qr}
        </pre>
      )}
    </div>
  );
}
