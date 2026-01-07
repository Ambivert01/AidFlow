import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import EmptyState from "../../components/common/EmptyState";

export default function UsageHistory() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wallets/me")
      .then(res => setWallet(res.data))
      .catch(() => setWallet(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading usage history..." />;

  if (!wallet || !wallet.transactions || wallet.transactions.length === 0) {
    return (
      <EmptyState
        title="No Usage Records"
        subtitle="Your aid usage will appear here once payments are made at approved merchants."
      />
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Usage History</h2>

      {wallet.transactions.map((t, i) => (
        <div key={i} className="bg-white p-3 shadow rounded mb-3">
          <p>
            <b>{t.category.toUpperCase()}</b> – ₹{t.amount}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(t.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
