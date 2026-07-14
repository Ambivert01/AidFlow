import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import NotificationBell from "./NotificationBell";

const ROLE_COLORS = {
  ADMIN:       "#5B3D8A",
  NGO:         "#E8530B",
  DONOR:       "#0E6E66",
  BENEFICIARY: "#A8710A",
  MERCHANT:    "#B23A6E",
  GOVERNMENT:  "#B23A2E",
};

const ROLE_NAV = {
  ADMIN: [
    { label: "Dashboard", to: "/admin" },
    { label: "Users", to: "/admin" },
    { label: "Merchants", to: "/admin" },
    { label: "Audit Logs", to: "/admin" },
  ],
  DONOR: [
    { label: "Dashboard", to: "/donor" },
    { label: "Campaigns", to: "/donor" },
    { label: "My Donations", to: "/donor" },
  ],
  NGO: [
    { label: "Dashboard", to: "/ngo" },
    { label: "New Campaign", to: "/ngo/campaigns/create" },
    { label: "Beneficiaries", to: "/ngo/beneficiaries/register" },
    { label: "Reviews", to: "/ngo/reviews" },
  ],
  BENEFICIARY: [
    { label: "My Wallet", to: "/beneficiary" },
  ],
  MERCHANT: [
    { label: "Dashboard", to: "/merchant" },
    { label: "Scan QR", to: "/merchant/scan" },
    { label: "Transactions", to: "/merchant/transactions" },
  ],
  GOVERNMENT: [
    { label: "Overview", to: "/government" },
    { label: "Escalations", to: "/government/escalated" },
    { label: "Fraud Monitor", to: "/government/fraud" },
    { label: "Wallets", to: "/government/wallets" },
    { label: "Campaigns", to: "/government/campaigns" },
  ],
};

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const isAuthenticated = !!(user && token);
  const role = user?.role || null;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = ROLE_NAV[role] || [];
  const roleColor = ROLE_COLORS[role] || "var(--color-steel)";

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to={isAuthenticated && role ? `/${role.toLowerCase()}` : "/"} className="navbar-brand" style={{ flexShrink: 0 }}>
        Aid<span>Flow</span>
      </Link>

      {/* Role nav links */}
      {isAuthenticated && navItems.length > 0 && (
        <div className="navbar-nav">
          {navItems.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              className={`navbar-link${location.pathname === item.to ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Public nav (unauthenticated) */}
      {!isAuthenticated && (
        <div className="navbar-nav">
          <Link to="/public/campaigns" className="navbar-link">Browse Campaigns</Link>
          <Link to="/public-audit" className="navbar-link">Public Audit</Link>
          <Link to="/#how-it-works" className="navbar-link">How It Works</Link>
        </div>
      )}

      {/* Right side */}
      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <NotificationBell />
            <span
              className="navbar-role-badge"
              style={{ background: `${roleColor}20`, color: roleColor, borderColor: `${roleColor}40` }}
            >
              {role}
            </span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
              {user?.name?.split(" ")[0]}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)" }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm"
              style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)" }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
