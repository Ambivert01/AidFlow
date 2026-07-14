import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section
      className="animate-fade-up"
      style={{
        background: "var(--color-ink)",
        color: "white",
        padding: "var(--space-12) var(--space-4)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: "700", marginBottom: "var(--space-3)" }}>
          Pick a side of the ledger.
        </h2>
        <p style={{ fontSize: "16px", marginBottom: "var(--space-6)", color: "rgba(255,255,255,0.65)" }}>
          Donate and watch every step, run an NGO under policy enforcement, or
          just check the audit trail without an account.
        </p>
        <div className="row" style={{ justifyContent: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start donating
          </Link>
          <Link
            to="/request-access"
            className="btn btn-ghost btn-lg"
            style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)" }}
          >
            Register your NGO
          </Link>
          <Link
            to="/public-audit"
            className="btn btn-ghost btn-lg"
            style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)" }}
          >
            Open the public audit
          </Link>
        </div>
      </div>
    </section>
  );
}
