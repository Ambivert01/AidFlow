import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function MerchantTransactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments/merchant-history")
      .then(res => setTxs(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading transactions..." />;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Transactions</h2>

      {txs.length === 0 && <p className="text-gray-400">No transactions yet</p>}

      {txs.map(tx => (
        <div key={tx._id} className="bg-white p-4 shadow rounded mb-3">
          <p>Amount: ₹{tx.amount}</p>
          <p>Category: {tx.category}</p>
          <p className="text-sm text-gray-500">
            {new Date(tx.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
