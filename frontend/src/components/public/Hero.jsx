import { Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";

export default function Hero() {
  const { user } = useAuthStore();

  return (
    <section
      className="hero"
      style={{
        padding: "var(--space-12) var(--space-4)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Gradients */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "50%",
          height: "80%",
          background:
            "radial-gradient(circle, rgba(14,165,233,0.1) 0%, rgba(255,255,255,0) 70%)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "80%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 70%)",
          zIndex: 0,
        }}
      />

      <div
        className="stack-lg"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            margin: "0 auto",
            background: "var(--color-surface-alt)",
            padding: "4px 16px",
            borderRadius: "100px",
            border: "1px solid var(--color-border)",
            fontSize: "12px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--color-text-muted)",
          }}
        >
          AI-Powered • Blockchain-Verified • Real-Time
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: "900",
            letterSpacing: "-0.03em",
            lineHeight: "1.1",
            color: "var(--color-text)",
            margin: "var(--space-2) 0",
          }}
        >
          Track Every Rupee
          <br />
          <span
            style={{
              color: "var(--color-primary)",
              textShadow: "0 0 40px rgba(14,165,233, 0.4)",
            }}
          >
            You Donate
          </span>
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "var(--color-text-muted)",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Proof-based donation system powered by AI & Blockchain. Every donation
          is tracked, verified, and auditable in real-time.
        </p>

        <div
          className="row"
          style={{
            justifyContent: "center",
            gap: "var(--space-4)",
            marginTop: "var(--space-4)",
          }}
        >
          {user ? (
            <Link
              to={`/${user.role.toLowerCase()}`}
              className="btn btn-primary btn-lg"
              style={{ padding: "16px 40px", fontSize: "18px" }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="btn btn-primary btn-lg"
                style={{
                  padding: "16px 40px",
                  fontSize: "18px",
                  boxShadow: "0 8px 24px rgba(14,165,233, 0.3)",
                }}
              >
                Donate Now
              </Link>
              <Link
                to="/request-access"
                className="btn btn-ghost btn-lg"
                style={{ padding: "16px 40px", fontSize: "18px" }}
              >
                Register NGO
              </Link>
              <Link
                to="/public-audit"
                className="btn btn-ghost btn-lg"
                style={{ padding: "16px 40px", fontSize: "18px" }}
              >
                View Transparency
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
