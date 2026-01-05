import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function WalletView() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wallets/me")
      .then(res => setWallet(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading wallet..." />;

  if (!wallet) {
    return (
      <div className="bg-yellow-100 p-4 rounded">
        Wallet not yet assigned.
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded shadow space-y-2">
      <h2 className="text-lg font-semibold">AidFlow Wallet</h2>

      <p>
        <span className="font-medium">Balance:</span>{" "}
        ₹{wallet.amount}
      </p>

      <p>
        <span className="font-medium">Allowed Categories:</span>{" "}
        {wallet.allowedCategories.join(", ")}
      </p>

      <p className="text-sm text-gray-500">
        Expires in {wallet.expiresInDays} days
      </p>
    </div>
  );
}
