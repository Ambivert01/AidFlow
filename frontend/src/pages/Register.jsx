import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/authStore";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    
    try {
      // Donors self-register directly through the auth endpoint with role DONOR
      await api.post("/auth/register", { ...formData, role: "DONOR" });
      
      // Auto-login after successful registration
      await login({ email: formData.email, password: formData.password });
      
      // Router will catch the state and redirect to /donor automatically
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Email may already be in use.");
      setLoading(false);
    }
  };

  return (
    <div className="center-page" style={{ padding: "var(--space-6)" }}>
      <div className="card shadow-xl hover-lift" style={{ maxWidth: "460px", width: "100%", padding: "var(--space-8)", animation: "fadeInUp 500ms ease-out" }}>
        
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)", animation: "fadeInDown 600ms ease-out" }}>
          <div style={{ display: "inline-flex", background: "var(--color-primary-light)", color: "var(--color-primary-dark)", padding: "4px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-4)", transition: "all 300ms ease" }}>
            Donor Registration
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Fund Transparent Aid
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
            Join AidFlow to track your donations down to the very last rupee with 100% cryptographic certainty. 
          </p>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: "var(--space-4)", animation: "slideInLeft 300ms ease-out" }}>{error}</div>}

        <form onSubmit={handleSubmit} className="stack">
          <div className="form-group" style={{ animation: "fadeInUp 600ms ease-out 100ms both" }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input color-transition"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group" style={{ animation: "fadeInUp 600ms ease-out 150ms both" }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input color-transition"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group" style={{ animation: "fadeInUp 600ms ease-out 200ms both" }}>
            <label className="form-label">Create Password</label>
            <input
              type="password"
              name="password"
              className="form-input color-transition"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              minLength="6"
              required
            />
          </div>

          <div className="alert alert-info" style={{ fontSize: "12px", marginTop: "var(--space-2)", animation: "fadeIn 600ms ease-out 250ms both" }}>
            By registering, you agree to our Terms of Service and Privacy Policy. AidFlow utilizes public blockchain ledgers for donor transparency.
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full btn-lg transition-smooth" 
            disabled={loading}
            style={{ marginTop: "var(--space-2)", boxShadow: "0 4px 14px 0 rgba(14,165,233, 0.39)", animation: "fadeInUp 600ms ease-out 300ms both" }}
          >
            {loading ? "Creating Account..." : "Create Donor Account"}
          </button>
        </form>

        <div style={{ marginTop: "var(--space-6)", textAlign: "center", fontSize: "14px", animation: "fadeInUp 600ms ease-out 350ms both" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Already have an account? </span>
          <Link to="/login" style={{ fontWeight: "600", color: "var(--color-primary)", textDecoration: "none", transition: "all 250ms ease" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
            Sign In
          </Link>
        </div>
        
        <div style={{ marginTop: "var(--space-6)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)", textAlign: "center", fontSize: "12px", animation: "fadeInUp 600ms ease-out 400ms both" }}>
          <p style={{ color: "var(--color-text-faint)" }}>
            Are you an NGO, Merchant, or Government Authority?
            <br />
            <Link to="/request-access" style={{ fontWeight: "600", color: "var(--color-text-muted)", textDecoration: "underline", transition: "all 250ms ease" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}>Apply for network access here.</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
