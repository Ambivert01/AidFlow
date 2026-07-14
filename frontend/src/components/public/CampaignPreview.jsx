import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublicCampaigns } from "../../services/public.service";

export default function CampaignPreview() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await getPublicCampaigns(6);
      if (response.success) {
        setCampaigns(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section
        className="animate-fade-in"
        style={{
          padding: "var(--space-12) var(--space-4)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div className="loader-center" style={{ minHeight: "200px" }}>
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) {
    return (
      <section
        className="animate-fade-up"
        style={{
          padding: "var(--space-12) var(--space-4)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Active Campaigns</div>
          <div className="empty-state-desc">No active campaigns at the moment. Check back soon!</div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="animate-fade-up"
      style={{
        padding: "var(--space-12) var(--space-4)",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div className="animate-fade-down" style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "var(--space-2)",
          }}
        >
          Open campaigns
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          Each one is policy-locked the moment it's approved — funds can only move where the campaign rules allow.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {campaigns.map((campaign, idx) => {
          const progress =
            campaign.targetAmount > 0
              ? (campaign.totalDonated / campaign.targetAmount) * 100
              : 0;

          return (
            <Link key={campaign._id} to={`/public/campaigns/${campaign._id}`} style={{ textDecoration: "none" }}>
              <div className="card stack hover-lift animate-fade-up" style={{ animationDelay: `${idx * 0.1}s`, cursor: "pointer", height: "100%" }}>
                <div
                  className="badge badge-blue"
                  style={{
                    display: "inline-block",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  {campaign.disasterType || "Relief"}
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "var(--space-2)" }}>
                  {campaign.title}
                </h3>

                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "13px",
                    marginBottom: "var(--space-4)",
                    flex: 1,
                  }}
                >
                  {campaign.description?.slice(0, 80)}...
                </p>

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>Progress</span>
                    <span style={{ fontWeight: "600", color: "var(--color-primary)" }}>{progress.toFixed(0)}%</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "var(--color-border)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--color-text-muted)" }}>Raised</div>
                    <div style={{ fontWeight: "700", color: "var(--color-signal)", fontFamily: "var(--font-mono)" }}>
                      ₹{(campaign.totalDonated / 100000).toFixed(1)}L
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "var(--color-text-muted)" }}>Target</div>
                    <div style={{ fontWeight: "700", fontFamily: "var(--font-mono)" }}>
                      ₹{(campaign.targetAmount / 100000).toFixed(1)}L
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
