export default function HowItWorks() {
  const steps = [
    { number: "01", title: "Donate", description: "Choose a campaign and donate securely" },
    { number: "02", title: "AI evaluates risk", description: "Eligibility and fraud checks run automatically" },
    { number: "03", title: "NGO disburses", description: "Funds move into a policy-locked beneficiary wallet" },
    { number: "04", title: "Proof uploaded", description: "Receipts and field photos are submitted for review" },
    { number: "05", title: "AI verifies the proof", description: "Authenticity, location, and duplicates are checked" },
    { number: "06", title: "Anchored on-chain", description: "The proof hash is sealed where no one can edit it" },
  ];

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
          The chain of custody
        </h2>
        <p style={{ color: "var(--color-text-muted)", maxWidth: "560px", margin: "0 auto" }}>
          Six checkpoints stand between your donation and the person it reaches.
          Each one writes a record that can't quietly disappear.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "var(--space-5)",
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="card stack animate-fade-up"
            style={{
              animationDelay: `${index * 0.08}s`,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-signal)",
                letterSpacing: "0.05em",
              }}
            >
              {step.number}
            </span>
            <h3 style={{ fontSize: "18px", fontWeight: "700", fontFamily: "var(--font-body)" }}>
              {step.title}
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: "1.5" }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
