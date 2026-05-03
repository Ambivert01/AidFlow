export default function FeatureHighlights() {
  const features = [
    {
      icon: "🤖",
      title: "AI Fraud Detection",
      description:
        "Advanced AI agents detect suspicious patterns, duplicate proofs, and fraudulent activities in real-time.",
      color: "var(--color-primary)",
    },
    {
      icon: "⛓️",
      title: "Blockchain Audit Trail",
      description:
        "Every transaction is cryptographically hashed and anchored on blockchain for immutable verification.",
      color: "var(--color-success)",
    },
    {
      icon: "💳",
      title: "Programmable Wallets",
      description:
        "Smart wallets with policy enforcement ensure funds are spent only on approved categories and merchants.",
      color: "var(--color-warning)",
    },
    {
      icon: "📊",
      title: "Real-time Transparency",
      description:
        "Track every rupee from donation to impact with live updates and public audit trails.",
      color: "var(--color-info)",
    },
  ];

  return (
    <section
      style={{
        padding: "var(--space-12) var(--space-4)",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
        <h2
          style={{
            fontSize: "36px",
            fontWeight: "800",
            marginBottom: "var(--space-2)",
          }}
        >
          Why AidFlow?
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Built on cutting-edge technology to ensure complete accountability
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {features.map((feature) => (
          <div
            key={feature.title}
            className="card stack"
            style={{
              textAlign: "center",
              padding: "var(--space-6)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "var(--space-3)",
              }}
            >
              {feature.icon}
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                marginBottom: "var(--space-2)",
                color: feature.color,
              }}
            >
              {feature.title}
            </h3>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
