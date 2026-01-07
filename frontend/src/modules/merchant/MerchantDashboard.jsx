import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";
import { Link } from "react-router-dom";

export default function MerchantDashboard() {
  return (
    <div className="space-y-6">
      <RoleContextBanner
        role="MERCHANT"
        message="Accept aid-wallet payments only for your approved category. All transactions are audited."
      />

      <InfoNotice
        title="Merchant Responsibility"
        message="You can accept payments only for your registered category. Any misuse is permanently logged and visible to authorities."
      />

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Approved Category</p>
          <p className="text-xl font-semibold">Food</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Transactions Today</p>
          <p className="text-xl font-semibold">12</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Total Amount Today</p>
          <p className="text-xl font-semibold">₹18,400</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/merchant/scan"
          className="bg-blue-600 text-white p-4 rounded text-center"
        >
          Scan Beneficiary Wallet
        </Link>

        <Link
          to="/merchant/transactions"
          className="bg-gray-800 text-white p-4 rounded text-center"
        >
          View Transactions
        </Link>

        <InfoNotice
          title="Merchant Rules"
          message="Aid payments are category-restricted, policy-bound, and immutable. Any misuse triggers automatic freeze and government escalation."
        />

        {/* QR */}
        <GenerateQR />

        {/* History */}
        <PaymentHistory />
      </div>
    </div>
  );
}
