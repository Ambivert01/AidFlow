import { useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function MerchantScan() {
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/merchant/spend", {
        walletId,
        amount: Number(amount),
      });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-xl font-bold">Accept Aid Payment</h2>

      <input
        placeholder="Wallet ID"
        className="border p-2 w-full"
        value={walletId}
        onChange={(e) => setWalletId(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount"
        className="border p-2 w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={submit}
        disabled={loading}
        className="bg-blue-600 text-white w-full py-2 rounded"
      >
        {loading ? "Processing..." : "Confirm Payment"}
      </button>

      {result && (
        <div className="bg-green-50 border p-3 rounded text-sm">
          Payment successful. Remaining balance: ₹{result.remainingBalance}
        </div>
      )}
    </div>
  );
}
