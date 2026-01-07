import { useEffect, useState } from "react";
import api from "../../services/api";
import InfoNotice from "../../components/InfoNotice";

export default function WalletView() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wallets/me")
      .then(res => setWallet(res.data))
      .catch(() => setWallet(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading wallet…</p>;

  if (!wallet) {
    return (
      <InfoNotice
        title="Wallet not assigned"
        message="Your aid wallet will be created once NGO approval is completed."
      />
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow space-y-2">
      <p><b>Balance:</b> ₹{wallet.balance}</p>
      <p><b>Allowed Categories:</b> {wallet.policy.allowedCategories.join(", ")}</p>
      <p><b>Status:</b> {wallet.status}</p>
      <p className="text-sm text-gray-500">
        Expires on: {new Date(wallet.policy.expiresAt).toLocaleDateString()}
      </p>
    </div>
  );
}
