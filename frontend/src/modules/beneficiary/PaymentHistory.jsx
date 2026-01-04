import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments/history")
      .then(res => setHistory(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading payment history..." />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Payment History</h2>

      {history.length === 0 && (
        <p className="text-gray-400">No transactions yet</p>
      )}

      {history.map(p => (
        <div key={p._id} className="bg-white p-4 shadow rounded mb-3">
          <p>Merchant: {p.merchantName}</p>
          <p>Category: {p.category}</p>
          <p>Amount: ₹{p.amount}</p>
          <p className="text-sm text-gray-500">
            {new Date(p.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
