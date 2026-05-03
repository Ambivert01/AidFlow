import { useState, useEffect } from "react";
import { getPublicStats } from "../../services/public.service";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getPublicStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section
        style={{
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          padding: "var(--space-4)",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          Loading live statistics...
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      label: "Total Donations",
      value: stats.totalDonations.toLocaleString(),
      color: "var(--color-primary)",
    },
    {
      label: "Amount Donated",
      value: `₹${(stats.totalDonationAmount / 1000).toFixed(1)}K`,
      color: "var(--color-success)",
    },
    {
      label: "Verified Proofs",
      value: `${stats.verifiedProofs}/${stats.totalProofs}`,
      color: "var(--color-text)",
    },
    {
      label: "Active NGOs",
      value: stats.activeNGOs.toLocaleString(),
      color: "var(--color-primary)",
    },
    {
      label: "Blockchain Anchored",
      value: stats.blockchainAnchored.toLocaleString(),
      color: "var(--color-success)",
    },
    {
      label: "Fraud Detected",
      value: stats.fraudDetected.toLocaleString(),
      color: "var(--color-danger)",
    },
  ];

  return (
    <section
      style={{
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        padding: "var(--space-6) var(--space-4)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
          marginBottom: "var(--space-4)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "var(--space-2)",
          }}
        >
          Live Transparency Dashboard
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Real-time statistics • Updates every 30 seconds
        </p>
      </div>

      <div
        className="ticker-wrapper"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "var(--space-6)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {statItems.map((stat) => (
          <div key={stat.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "900",
                color: stat.color,
                marginBottom: "var(--space-1)",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-faint)",
                fontWeight: "600",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "var(--space-4)",
          fontSize: "12px",
          color: "var(--color-text-faint)",
        }}
      >
        Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
      </div>
    </section>
  );
}
