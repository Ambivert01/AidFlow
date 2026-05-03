export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Donate",
      description: "Choose a campaign and donate securely",
      icon: "💝",
    },
    {
      number: "2",
      title: "NGO Uses Funds",
      description: "NGO spends on verified beneficiaries",
      icon: "🏢",
    },
    {
      number: "3",
      title: "Proof Uploaded",
      description: "NGO uploads bills, photos, and receipts",
      icon: "📸",
    },
    {
      number: "4",
      title: "AI Verifies",
      description: "AI validates authenticity and detects fraud",
      icon: "🤖",
    },
    {
      number: "5",
      title: "Blockchain Stores",
      description: "Proof hash anchored on blockchain",
      icon: "⛓️",
    },
    {
      number: "6",
      title: "Donor Tracks",
      description: "You see exactly where your money went",
      icon: "✅",
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
          How It Works
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Complete transparency from donation to impact verification
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="card stack"
            style={{
              textAlign: "center",
              position: "relative",
              padding: "var(--space-6)",
            }}
          >
            {/* Step Number Badge */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--color-primary)",
                color: "white",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "700",
                boxShadow: "0 4px 12px rgba(14,165,233, 0.3)",
              }}
            >
              {step.number}
            </div>

            <div style={{ fontSize: "48px", marginBottom: "var(--space-2)" }}>
              {step.icon}
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "700" }}>
              {step.title}
            </h3>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {step.description}
            </p>

            {/* Arrow connector (except last item) */}
            {index < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  right: "-24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "24px",
                  color: "var(--color-border)",
                  display: window.innerWidth > 768 ? "block" : "none",
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
