// src/modules/merchant/PaymentHistory.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function PaymentHistory() {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api.get("/payments/history").then(res => setHistory(res.data));
  }, []);

  if (!history) return <Loader text="Loading transactions..." />;

  if (history.length === 0) {
    return <p className="text-gray-400">No transactions yet</p>;
  }

  return (
    <div>
      <h2 className="font-bold mb-3">Transaction History</h2>

      {history.map(tx => (
        <div key={tx._id} className="bg-white p-3 shadow rounded mb-2">
          <p>Wallet: {tx.walletId}</p>
          <p>Category: {tx.category}</p>
          <p>Amount: ₹{tx.amount}</p>
          <p className="text-xs text-gray-500">
            {new Date(tx.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
