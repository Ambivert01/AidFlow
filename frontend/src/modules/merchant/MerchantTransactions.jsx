import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function MerchantTransactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/merchant/transactions")
      .then(res => setTxs(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading transactions..." />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Transactions</h2>

      {txs.length === 0 && <p>No transactions yet</p>}

      {txs.map((t, i) => (
        <div key={i} className="bg-white p-3 rounded shadow mb-2">
          <p>Amount: ₹{t.amount}</p>
          <p>Category: {t.category}</p>
          <p>Beneficiary: {t.beneficiary?.name}</p>
          <p className="text-xs text-gray-500">
            {new Date(t.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
