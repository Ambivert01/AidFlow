import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";

import { Link } from "react-router-dom";
import WalletView from "./WalletView";

export default function BeneficiaryDashboard() {
  return (
    <div className="space-y-6">
      <RoleContextBanner
        role="BENEFICIARY"
        message="If aid is assigned to you, it will appear in your wallet below."
      />

      <InfoNotice
        title="No aid assigned yet"
        message="When a donation is approved and assigned to you, your AidFlow wallet will appear here. You do not need to take any action."
      />

      <h1 className="text-2xl font-bold">Beneficiary Dashboard</h1>

      {/* Wallet Summary */}
      <WalletView />

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/beneficiary/scan"
          className="bg-blue-600 text-white p-4 rounded shadow text-center hover:bg-blue-700"
        >
          Scan Merchant QR
        </Link>

        <Link
          to="/beneficiary/history"
          className="bg-gray-800 text-white p-4 rounded shadow text-center hover:bg-gray-900"
        >
          Payment History
        </Link>
      </div>
    </div>
  );
}
