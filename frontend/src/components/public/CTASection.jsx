import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
        color: "white",
        padding: "var(--space-12) var(--space-4)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "36px",
            fontWeight: "800",
            marginBottom: "var(--space-4)",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          Ready to Experience Complete Transparency?
        </h2>
        <p
          style={{
            fontSize: "18px",
            marginBottom: "var(--space-6)",
            opacity: 0.9,
          }}
        >
          Join thousands of donors and NGOs building a more transparent future
          for humanitarian aid
        </p>
        <div
          className="row"
          style={{
            justifyContent: "center",
            gap: "var(--space-4)",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/register"
            className="btn btn-lg"
            style={{
              background: "white",
              color: "var(--color-primary-dark)",
              padding: "16px 40px",
              fontSize: "16px",
              fontWeight: "700",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            Start Donating
          </Link>
          <Link
            to="/request-access"
            className="btn btn-lg"
            style={{
              background: "transparent",
              color: "white",
              border: "2px solid white",
              padding: "16px 40px",
              fontSize: "16px",
              fontWeight: "700",
            }}
          >
            Register as NGO
          </Link>
          <Link
            to="/public-audit"
            className="btn btn-lg"
            style={{
              background: "transparent",
              color: "white",
              border: "2px solid white",
              padding: "16px 40px",
              fontSize: "16px",
              fontWeight: "700",
            }}
          >
            Explore Public Audit
          </Link>
        </div>
      </div>
    </section>
  );
}
