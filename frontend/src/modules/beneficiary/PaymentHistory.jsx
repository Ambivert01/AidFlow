import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wallet/transactions")
      .then(res => setHistory(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading payment history..." />;

  if (history.length === 0) {
    return <p className="text-gray-400">No transactions yet</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Payment History</h2>

      {history.map(tx => (
        <div key={`${tx.timestamp || ""}_${tx.amount || ""}_${tx.reference || ""}`} className="bg-white p-4 shadow rounded mb-3">
          <p><b>Type:</b> {tx.type || "DEBIT"}</p>
          <p><b>Category:</b> {tx.category}</p>
          <p><b>Amount:</b> ₹{tx.amount}</p>
          <p className="text-sm text-gray-500">
            {new Date(tx.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
