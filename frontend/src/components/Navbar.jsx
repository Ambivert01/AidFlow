import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../utils/constants";

export default function Navbar() {
  const { role } = useAuth();

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">
        AidFlow
      </div>

      <div className="flex gap-4 text-sm font-medium">
        {role === ROLES.DONOR && (
          <>
            <Link to="/donor">Dashboard</Link>
            <Link to="/donor/donate">Donate</Link>
            <Link to="/donor/history">History</Link>
          </>
        )}

        {role === ROLES.NGO && (
          <>
            <Link to="/ngo">Dashboard</Link>
            <Link to="/ngo/campaigns">Campaigns</Link>
            <Link to="/ngo/beneficiaries">Beneficiaries</Link>
          </>
        )}

        {role === ROLES.BENEFICIARY && (
          <>
            <Link to="/beneficiary">Dashboard</Link>
            <Link to="/beneficiary/wallet">Wallet</Link>
          </>
        )}

        {role === ROLES.MERCHANT && (
          <>
            <Link to="/merchant">Dashboard</Link>
            <Link to="/merchant/scan">Scan QR</Link>
          </>
        )}

        {role === ROLES.GOVERNMENT && (
          <>
            <Link to="/government">Dashboard</Link>
            <Link to="/government/monitor">Fraud Monitor</Link>
          </>
        )}

        {role === ROLES.PUBLIC && (
          <>
            <Link to="/public/audit">Audit</Link>
          </>
        )}

        <span className="text-xs text-gray-500 border-l pl-4">
          Logged in as: <b className="text-gray-700">{role.toUpperCase()}</b>
        </span>
        
      </div>
    </nav>
  );
}
