import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../utils/constants";

export default function Navbar() {
  const { isAuthenticated, role, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Brand */}
        <Link to="/" className="text-xl font-semibold text-blue-700">
          AidFlow
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-5 text-sm font-medium">

          {/* PUBLIC (not logged in) */}
          {!isAuthenticated && (
            <>
              <Link to="/public" className="hover:text-blue-700">
                Public Audit
              </Link>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800"
              >
                Login
              </Link>
            </>
          )}

          {/* AUTHENTICATED */}
          {isAuthenticated && (
            <>
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

              <button
                onClick={handleLogout}
                className="ml-3 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
