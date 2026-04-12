import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login({ email, password });
    
    // AuthStore handles state. On success, App.jsx router will unrender login
    // and route to the correct role dashboard automatically based on user.role
  };

  return (
    <div className="center-page" style={{ padding: "var(--space-6)" }}>
      <div className="card shadow-xl hover-lift" style={{ maxWidth: "400px", width: "100%", padding: "var(--space-8)", animation: "fadeInUp 500ms ease-out" }}>
        
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)", animation: "fadeInDown 600ms ease-out" }}>
          <div style={{ fontSize: "32px", fontWeight: "900", letterSpacing: "-0.05em", color: "var(--color-primary-dark)", marginBottom: "var(--space-2)" }}>
            AidFlow<span style={{ color: "var(--color-primary)", fontSize: "40px", lineHeight: 0 }}>.</span>
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: "1.5" }}>
            Sign in to your dashboard to manage, disburse, or receive transparent humanitarian aid.
          </p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)", animation: "slideInLeft 300ms ease-out" }}>{error}</div>}

        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group" style={{ animation: "fadeInUp 600ms ease-out 100ms both" }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input color-transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.org"
              required
            />
          </div>

          <div className="form-group" style={{ animation: "fadeInUp 600ms ease-out 200ms both" }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input color-transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full btn-lg transition-smooth" 
            disabled={loading}
            style={{ marginTop: "var(--space-2)", boxShadow: "0 4px 14px 0 rgba(14,165,233, 0.39)", animation: "fadeInUp 600ms ease-out 300ms both" }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "var(--space-8)", paddingTop: "var(--space-6)", borderTop: "1px solid var(--color-border)", textAlign: "center", fontSize: "13px", animation: "fadeInUp 600ms ease-out 400ms both" }}>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
            Don&apos;t have an account?
          </p>
          <div className="row" style={{ justifyContent: "center", gap: "var(--space-2)" }}>
             <Link to="/register" className="btn btn-ghost btn-sm transition-smooth" style={{ fontWeight: "600", color: "var(--color-primary-dark)" }}>
               Register as Donor
             </Link>
             <span style={{ color: "var(--color-border-strong)" }}>|</span>
             <Link to="/request-access" className="btn btn-ghost btn-sm transition-smooth" style={{ fontWeight: "600", color: "var(--color-secondary)" }}>
               Partners (NGO/Merchant)
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
