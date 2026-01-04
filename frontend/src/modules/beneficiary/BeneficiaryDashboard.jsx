import { Link } from "react-router-dom";
import WalletView from "./WalletView";

export default function BeneficiaryDashboard() {
  return (
    <div className="space-y-6">
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
