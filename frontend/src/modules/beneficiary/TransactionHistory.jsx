import { useEffect, useState } from "react";
import api from "../../services/api";

export default function TransactionHistory() {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    api.get("/wallets/me").then(res => setWallet(res.data));
  }, []);

  if (!wallet?.transactions?.length) {
    return <p className="text-gray-400">No transactions yet</p>;
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">Usage History</h3>

      {wallet.transactions.map((t, i) => (
        <div key={i} className="text-sm border-b py-2">
          <p>{t.type} ₹{t.amount} ({t.category})</p>
          <p className="text-xs text-gray-500">
            {new Date(t.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
