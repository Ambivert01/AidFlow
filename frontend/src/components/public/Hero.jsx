import { Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const LEDGER_LINES = [
  { label: "Donation #DN-2291", state: "AI risk-checked", tone: "verified" },
  { label: "Beneficiary B-4410", state: "Eligibility confirmed", tone: "signal" },
  { label: "Proof PX-1187", state: "Anchored on-chain", tone: "verified" },
];

export default function Hero() {
  const { user } = useAuthStore();

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-signal)", display: "inline-block" }} />
          Field Ledger · Live
        </div>

        <h1 className="hero-title animate-fade-up">
          Aid that proves
          <br />
          <span>where it went.</span>
        </h1>

        <p className="hero-subtitle animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Every donation moves through policy-enforced wallets, AI eligibility
          and fraud checks, and a blockchain-anchored audit trail. Nothing
          here asks you to take our word for it — you can trace it yourself.
        </p>

        <div className="hero-cta animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {user ? (
            <Link to={`/${user.role.toLowerCase()}`} className="btn btn-primary btn-lg">
              Go to your dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Donate to a campaign
              </Link>
              <Link to="/request-access" className="btn btn-ghost btn-lg" style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)" }}>
                Register your NGO
              </Link>
              <Link to="/public-audit" className="btn btn-ghost btn-lg" style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)" }}>
                Trace a donation →
              </Link>
            </>
          )}
        </div>

        {/* Live ledger strip — the mechanism, not a metric */}
        <div
          className="animate-fade-up"
          style={{
            animationDelay: "0.3s",
            marginTop: "var(--space-10)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "var(--space-3)",
          }}
        >
          {LEDGER_LINES.map((line, i) => (
            <div
              key={line.label}
              className="row"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "var(--radius-full)",
                padding: "6px 14px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                gap: "8px",
                animationDelay: `${0.3 + i * 0.1}s`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: line.tone === "verified" ? "var(--color-verified)" : "var(--color-signal)",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.85)" }}>{line.label}</span>
              <span>·</span>
              <span>{line.state}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
