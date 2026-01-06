import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../utils/constants";
import { NAVIGATION } from "../config/navigation.config";

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
          {/* PUBLIC */}
          {!isAuthenticated &&
            NAVIGATION.PUBLIC.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}

          {/* AUTHENTICATED */}
          {isAuthenticated &&
            NAVIGATION[role]?.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="ml-3 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
