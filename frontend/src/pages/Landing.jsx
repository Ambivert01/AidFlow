import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Landing() {
  const { user } = useAuthStore();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero" style={{ padding: "var(--space-12) var(--space-4)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        
        {/* Background Gradients */}
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "80%", background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, rgba(255,255,255,0) 70%)", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "80%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 70%)", zIndex: 0 }} />

        <div className="stack-lg" style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", margin: "0 auto", background: "var(--color-surface-alt)", padding: "4px 16px", borderRadius: "100px", border: "1px solid var(--color-border)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>
             Transparent • Cryptographic • Instant
          </div>
          
          <h1 style={{ fontSize: "64px", fontWeight: "900", letterSpacing: "-0.03em", lineHeight: "1.1", color: "var(--color-text)", margin: "var(--space-2) 0" }}>
            The Future of <br/>
            <span style={{ color: "var(--color-primary)", textShadow: "0 0 40px rgba(14,165,233, 0.4)" }}>Humanitarian Aid.</span>
          </h1>
          
          <p style={{ fontSize: "20px", color: "var(--color-text-muted)", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            AidFlow ensures every rupee donated reaches the right person, for the right purpose. Powered by zero-trust architecture, AI vulnerability scoring, and cryptographic ledgers.
          </p>

          <div className="row" style={{ justifyContent: "center", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
            {user ? (
               <Link to={`/${user.role.toLowerCase()}`} className="btn btn-primary btn-lg" style={{ padding: "16px 40px", fontSize: "18px" }}>Go to Dashboard</Link>
            ) : (
               <>
                 <Link to="/register" className="btn btn-primary btn-lg" style={{ padding: "16px 40px", fontSize: "18px", boxShadow: "0 8px 24px rgba(14,165,233, 0.3)" }}>Donate Now</Link>
                 <Link to="/public/campaigns" className="btn btn-ghost btn-lg" style={{ padding: "16px 40px", fontSize: "18px" }}>View Campaigns</Link>
               </>
            )}
          </div>
        </div>
      </section>

      {/* Live Stats Ticker */}
      <section style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", padding: "var(--space-4)", overflow: "hidden" }}>
         <div className="ticker-wrapper" style={{ display: "flex", gap: "var(--space-12)", justifyContent: "space-around", maxWidth: "1200px", margin: "0 auto" }}>
            {[
              { label: "Donations Anchored", value: "100%", color: "var(--color-success)" },
              { label: "Fraud Attempt Prevention", value: "99.8%", color: "var(--color-primary)" },
              { label: "Average Settlement Time", value: "< 2.4s", color: "var(--color-text)" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                 <div style={{ fontSize: "28px", fontWeight: "900", color: stat.color }}>{stat.value}</div>
                 <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-faint)", fontWeight: "600" }}>{stat.label}</div>
              </div>
            ))}
         </div>
      </section>

      {/* Network Roles Grid */}
      <section style={{ padding: "var(--space-12) var(--space-4)", maxWidth: "1200px", margin: "0 auto" }}>
         <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
           <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "var(--space-2)" }}>Network Participants</h2>
           <p style={{ color: "var(--color-text-muted)", maxWidth: "500px", margin: "0 auto" }}>An interoperable system designed for transparency at every stage of the aid lifecycle.</p>
         </div>

         <div className="grid-3">
           <div className="card text-center stack">
              <div style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>💝</div>
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Donors</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>Fund specific policies and track exactly who spents your money, where, and when.</p>
           </div>
           
           <div className="card text-center stack">
              <div style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>🏢</div>
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>NGOs & Agencies</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>Design automated aid policies and onboard beneficiaries with AI-assisted eligibility verification.</p>
           </div>
           
           <div className="card text-center stack">
              <div style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>👤</div>
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Beneficiaries</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>Receive digital smart wallets limiting spend to basic necessities without relying on bank accounts.</p>
           </div>

           <div className="card text-center stack">
              <div style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>🏪</div>
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Merchants</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>Scan dynamic JWT QR tokens to fulfill authorized supplies and receive instant, guaranteed settlement.</p>
           </div>

           <div className="card text-center stack" style={{ gridColumn: "span 2" }}>
              <div style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>🏛️</div>
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Government & Auditors</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>Monitor systemic risk, freeze illicit wallets, review high-risk AI escalations, and cryptographically verify the entire workflow via Merkle proofs anchored to an immutable blockchain ledger.</p>
           </div>
         </div>
      </section>

      {/* CTA Footer */}
      <section style={{ background: "var(--color-primary-dark)", color: "white", padding: "var(--space-12) var(--space-4)", textAlign: "center" }}>
         <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "var(--space-4)" }}>Ready to experience complete transparency?</h2>
         <div className="row" style={{ justifyContent: "center", gap: "var(--space-4)" }}>
            <Link to="/public-audit" className="btn btn-lg" style={{ background: "white", color: "var(--color-primary-dark)", padding: "16px 40px", fontSize: "16px", fontWeight: "700" }}>
              Explore Public Audit Ledger
            </Link>
         </div>
      </section>
    </div>
  );
}
