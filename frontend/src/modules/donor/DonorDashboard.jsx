import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Donate from "./Donate";

const STATUS_BADGE = {
  CREATED: "badge-gray",
  PENDING_NGO_REVIEW: "badge-yellow",
  NGO_APPROVED: "badge-blue",
  HIGH_RISK_ESCALATED: "badge-orange",
  APPROVED_BY_GOVT: "badge-green",
  REJECTED_BY_GOVT: "badge-red",
  WALLET_CREATING: "badge-blue",
  READY_FOR_USE: "badge-green",
  ELIGIBILITY_FAILED: "badge-red",
  REJECTED: "badge-red",
  AUDIT_FINALIZED: "badge-teal",
};

const STATUS_LABELS = {
  CREATED: "Created",
  PENDING_NGO_REVIEW: "Awaiting NGO",
  NGO_APPROVED: "NGO Approved",
  HIGH_RISK_ESCALATED: "Escalated to Govt",
  APPROVED_BY_GOVT: "Govt Approved",
  REJECTED_BY_GOVT: "Govt Rejected",
  WALLET_CREATING: "Wallet Creating",
  READY_FOR_USE: "Active — Aid Disbursed",
  ELIGIBILITY_FAILED: "Eligibility Failed",
  REJECTED: "Rejected",
  AUDIT_FINALIZED: "Finalized ✓",
};

export default function DonorDashboard() {
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, donationsRes, campRes] = await Promise.all([
          api.get("/donations/dashboard"),
          api.get("/donations/my"),
          api.get("/public/campaigns"),
        ]);
        setStats(statsRes.data?.data || statsRes.data);
        setDonations(donationsRes.data?.data || donationsRes.data || []);
        setCampaigns(campRes.data?.data || campRes.data || []);
      } catch (err) {
        console.error("DONOR DASHBOARD ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCampaigns = campaigns.filter((c) =>
    !campaignSearch || c.title.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '30%' }} />
        </div>
        <div className="card skeleton" style={{ height: '80px' }} />
        <div className="grid-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="stat-card skeleton" style={{ height: '100px' }} />
          ))}
        </div>
        <div className="card skeleton" style={{ height: '200px', marginTop: 'var(--space-6)' }} />
        <div className="card skeleton" style={{ height: '400px', marginTop: 'var(--space-6)' }} />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Donor Dashboard</h1>
        <p className="page-subtitle">Track your donations and see how your contributions are being used.</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid-4">
          {[
            { label: "Total Donated", value: `₹${(stats.totalDonated || 0).toLocaleString("en-IN")}`, sub: "Across all donations" },
            { label: "Total Donations", value: stats.totalDonations || 0, sub: "All records" },
            { label: "Active Disbursements", value: stats.activeDonations || 0, sub: "Aid in use" },
            { label: "Campaigns Supported", value: stats.campaignsSupported || 0, sub: "Unique campaigns" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Browse + donate */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Browse Active Campaigns</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCampaigns(!showCampaigns)}
          >
            {showCampaigns ? "Hide" : "Show Campaigns"}
          </button>
        </div>

        {showCampaigns && (
          <>
            <input
              className="form-input"
              placeholder="Search campaigns…"
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
              style={{ marginBottom: "var(--space-4)" }}
            />
            <div className="stack">
              {filteredCampaigns.map((c) => (
                <div key={c._id} className="card-sm row-between" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{c.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {c.disasterType} · {c.location?.district}, {c.location?.state}
                    </div>
                    {c.policySnapshot && (
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        Cap: ₹{c.policySnapshot.maxPerBeneficiary} per beneficiary · {c.policySnapshot.validityDays}d
                        &nbsp;· {c.policySnapshot.allowedCategories?.join(", ")}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedCampaign(c)} 
                    className="btn btn-primary btn-sm" 
                    style={{ flexShrink: 0 }}
                  >
                    Donate
                  </button>
                </div>
              ))}
              {filteredCampaigns.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-title">No campaigns found</div>
                </div>
              )}
            </div>
            
            {/* Inline donation form */}
            {selectedCampaign && (
              <Donate 
                campaign={selectedCampaign} 
                onClose={() => {
                  setSelectedCampaign(null);
                  api.get("/donor/donations").then(res => setDonations(res.data)); // Refresh donations
                }} 
              />
            )}
          </>
        )}
      </div>

      {/* My Donations */}
      <div className="card">
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "var(--space-4)" }}>My Donation History</h2>
        {donations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">No donations yet</div>
            <div className="empty-state-desc">Browse campaigns above and make your first contribution.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>AI Decision</th>
                  <th>Audit</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.donationId}>
                    <td>
                      <div style={{ fontWeight: "600" }}>{d.campaign?.title || "—"}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{d.campaign?.disasterType}</div>
                    </td>
                    <td style={{ fontWeight: "700" }}>₹{d.amount?.toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[d.status] || "badge-gray"}`}>
                        {STATUS_LABELS[d.status] || d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px" }}>{d.aiDecision || "—"}</td>
                    <td>
                      {d.auditFinalized ? (
                        <a href={`/public-audit?job=${d.donationId}`} className="btn btn-ghost btn-sm" style={{ fontSize: "11px" }}>
                          ✓ Verified
                        </a>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--color-text-faint)" }}>In Progress</span>
                      )}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {new Date(d.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <Link to={`/donor/donation/${d.donationId}`} className="btn btn-ghost btn-sm" style={{ fontSize: "12px" }}>
                        Timeline →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
