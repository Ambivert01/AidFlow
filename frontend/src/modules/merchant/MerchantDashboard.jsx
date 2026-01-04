import { Link, Outlet } from "react-router-dom";

export default function MerchantDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Merchant Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/merchant/qr"
          className="bg-blue-600 text-white p-4 rounded text-center"
        >
          Generate QR
        </Link>

        <Link
          to="/merchant/confirm"
          className="bg-green-600 text-white p-4 rounded text-center"
        >
          Confirm Payment
        </Link>

        <Link
          to="/merchant/history"
          className="bg-gray-800 text-white p-4 rounded text-center"
        >
          Transactions
        </Link>
      </div>

      {/* Nested Pages Render Here */}
      <Outlet />
    </div>
  );
}
