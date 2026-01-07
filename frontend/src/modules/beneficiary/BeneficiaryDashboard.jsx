// src/modules/beneficiary/BeneficiaryDashboard.jsx
import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";
import ScanQR from "./ScanQR";
import PaymentHistory from "./PaymentHistory";
import UsageHistory from "./UsageHistory";
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function BeneficiaryDashboard() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/wallet/me")
      .then((res) => setWallet(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading wallet..." />;

  if (!wallet) {
    return (
      <InfoNotice
        title="No Aid Assigned"
        message="You have not yet been assigned any aid. Please contact the NGO."
      />
    );
  }

  return (
    <div className="space-y-8">
      <RoleContextBanner
        role="BENEFICIARY"
        message="You can only spend aid via approved merchants and categories."
      />

      {/* WALLET SUMMARY */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Aid Wallet</h2>
        <p>
          <b>Balance:</b> ₹{wallet.balance}
        </p>
        <p>
          <b>Allowed:</b> {wallet.policy.allowedCategories.join(", ")}
        </p>
        <p className="text-sm text-gray-500">
          Expires on {new Date(wallet.policy.expiresAt).toDateString()}
        </p>
      </div>

      {/* ACTIONS */}

      <WalletView />
      <UsageHistory />
      <ScanQR />
      <PaymentHistory />
      <UsageHistory />
    </div>
  );
}
