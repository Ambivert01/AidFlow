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
        style={{
          padding: "var(--space-12) var(--space-4)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          Loading campaigns...
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) {
    return (
      <section
        style={{
          padding: "var(--space-12) var(--space-4)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: "800",
              marginBottom: "var(--space-2)",
            }}
          >
            Active Campaigns
          </h2>
          <p style={{ color: "var(--color-text-muted)" }}>
            No active campaigns at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

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
          Active Campaigns
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Support verified disaster relief campaigns with complete transparency
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "var(--space-6)",
        }}
      >
        {campaigns.map((campaign) => {
          const progress =
            campaign.targetAmount > 0
              ? (campaign.totalDonated / campaign.targetAmount) * 100
              : 0;

          return (
            <div key={campaign._id} className="card stack">
              {/* Disaster Type Badge */}
              <div
                style={{
                  display: "inline-block",
                  background: "var(--color-surface-alt)",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  color: "var(--color-primary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {campaign.disasterType}
              </div>

              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  marginBottom: "var(--space-2)",
                }}
              >
                {campaign.title}
              </h3>

              <p
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  marginBottom: "var(--space-4)",
                }}
              >
                {campaign.description?.substring(0, 120)}
                {campaign.description?.length > 120 ? "..." : ""}
              </p>

              {/* Location */}
              {campaign.location && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  📍 {campaign.location.district}, {campaign.location.state}
                </div>
              )}

              {/* Progress Bar */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--space-1)",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>
                    ₹{campaign.totalDonated.toLocaleString()}
                  </span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    of ₹{campaign.targetAmount.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "var(--color-surface-alt)",
                    borderRadius: "100px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--color-primary)",
                      width: `${Math.min(progress, 100)}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Trust Score (if available) */}
              {campaign.transparencyScore > 0 && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-success)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  ✓ Trust Score: {campaign.transparencyScore}/100
                </div>
              )}

              {/* NGO Name */}
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  marginBottom: "var(--space-4)",
                }}
              >
                By {campaign.createdBy?.name || "Unknown NGO"}
              </div>

              <Link
                to={`/register`}
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                Donate Now
              </Link>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: "var(--space-8)" }}>
        <Link to="/public/campaigns" className="btn btn-ghost">
          View All Campaigns →
        </Link>
      </div>
    </section>
  );
}
