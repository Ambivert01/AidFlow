export default function FeatureHighlights() {
  const features = [
    {
      tag: "AI",
      title: "Fraud detection that runs before money moves",
      description:
        "Eligibility, fraud, and risk agents evaluate every donation and beneficiary before funds are released — not after.",
      tone: "signal",
    },
    {
      tag: "CHAIN",
      title: "An audit trail no one can quietly edit",
      description:
        "Every proof is hashed, merkled, and anchored on-chain. The record exists independently of AidFlow's own database.",
      tone: "verified",
    },
    {
      tag: "WALLET",
      title: "Wallets that enforce policy, not just balance",
      description:
        "Beneficiary wallets lock spending to approved categories, merchants, and limits — the rules are the wallet.",
      tone: "caution",
    },
    {
      tag: "PUBLIC",
      title: "A ledger anyone can read without logging in",
      description:
        "Campaign totals, proof status, and blockchain anchors are public by default — verification doesn't require trust.",
      tone: "info",
    },
  ];

  const toneColor = {
    signal: "var(--color-signal)",
    verified: "var(--color-verified)",
    caution: "var(--color-caution)",
    info: "var(--color-info)",
  };

  return (
    <section
      className="animate-fade-up"
      style={{
        padding: "var(--space-12) var(--space-4)",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div className="animate-fade-down" style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: "700", marginBottom: "var(--space-2)" }}>
          The mechanism, not the marketing
        </h2>
        <p style={{ color: "var(--color-text-muted)", maxWidth: "560px", margin: "0 auto" }}>
          Four systems work together so accountability isn't a promise — it's enforced.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "var(--space-5)",
        }}
      >
        {features.map((feature, idx) => (
          <div
            key={feature.title}
            className="card stack animate-fade-up"
            style={{
              animationDelay: `${idx * 0.1}s`,
              borderTop: `3px solid ${toneColor[feature.tone]}`,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: toneColor[feature.tone],
              }}
            >
              {feature.tag}
            </span>
            <h3 style={{ fontSize: "17px", fontWeight: "700", lineHeight: 1.3 }}>
              {feature.title}
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
