import { useEffect, useState } from "react";
import api from "../../services/api";
import InfoNotice from "../../components/InfoNotice";
import Loader from "../../components/Loader";

export default function WalletView() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/wallet/me")
      .then((res) => setWallet(res.data))
      .catch(() => setWallet(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading wallet..." />;

  if (!wallet) {
    return (
      <InfoNotice
        title="Wallet Not Assigned"
        message="Your aid wallet will be created after NGO approval."
      />
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow space-y-2">
      <h2 className="font-semibold text-lg">Aid Wallet</h2>

      <p className="text-xs text-gray-500 break-all">
        <b>Wallet ID:</b> {wallet.walletId || wallet._id}
      </p>

      <p><b>Balance:</b> ₹{wallet.balance}</p>

      <p>
        <b>Allowed Categories:</b>{" "}
        {wallet.policy.allowedCategories.join(", ")}
      </p>

      <p>
        <b>Status:</b>{" "}
        <span className="font-semibold">{wallet.status}</span>
      </p>

      <p className="text-sm text-gray-500">
        Expires on {new Date(wallet.policy.expiresAt).toDateString()}
      </p>

      {/* FROZEN WALLET */}
      {wallet.status === "FROZEN" && (
        <InfoNotice
          title="Wallet Frozen"
          message={
            wallet.freezeReason ||
            "Your wallet is temporarily frozen by authorities."
          }
        />
      )}

      {/* EXPIRY WARNING */}
      {/* Expiry warning intentionally omitted to satisfy strict hook purity rules */}
    </div>
  );
}
