// src/modules/merchant/ConfirmPayment.jsx
import { useState } from "react";
import api from "../../services/api";

export default function ConfirmPayment() {
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    try {
      setLoading(true);
      await api.post("/merchant/spend", {
        walletId,
        amount: Number(amount),
        category,
      });
      alert("Payment successful");
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded shadow max-w-md">
      <h2 className="font-semibold mb-3">Confirm Aid Payment</h2>

      <input
        placeholder="Wallet ID"
        className="input w-full mb-2"
        value={walletId}
        onChange={e => setWalletId(e.target.value)}
      />

      <input
        placeholder="Amount"
        className="input w-full mb-2"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <input
        placeholder="Category"
        className="input w-full mb-3"
        value={category}
        onChange={e => setCategory(e.target.value)}
      />

      <button
        onClick={confirm}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? "Processing..." : "Confirm Payment"}
      </button>
    </div>
  );
}
