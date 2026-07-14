import { useState, useEffect } from "react";
import { getPublicStats } from "../../services/public.service";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
      <section className="stats-ticker" style={{ display: "block" }}>
        <div className="loader-center" style={{ minHeight: "120px" }}>
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    { label: "Donations recorded", value: stats.totalDonations.toLocaleString() },
    { label: "Total disbursed", value: `₹${(stats.totalDonationAmount / 1000).toFixed(1)}K` },
    { label: "Proofs verified", value: `${stats.verifiedProofs}/${stats.totalProofs}` },
    { label: "NGOs active", value: stats.activeNGOs.toLocaleString() },
    { label: "Anchored on-chain", value: stats.blockchainAnchored.toLocaleString() },
    { label: "Fraud flagged", value: stats.fraudDetected.toLocaleString() },
  ];

  return (
    <section style={{ background: "var(--color-ink)" }}>
      <div
        className="row"
        style={{
          justifyContent: "center",
          gap: "8px",
          padding: "10px 0 0",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-verified)", display: "inline-block" }} />
        Live · refreshed {new Date(stats.lastUpdated).toLocaleTimeString()}
      </div>
      <div className="stats-ticker">
        {statItems.map((stat) => (
          <div key={stat.label}>
            <span className="ticker-value">{stat.value}</span>
            <span className="ticker-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
