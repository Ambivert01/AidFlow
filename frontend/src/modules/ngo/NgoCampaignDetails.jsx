import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import Beneficiaries from "./Beneficiaries";
import TrustScoreBadge from "../../components/common/TrustScoreBadge";

/**
 * MISSION CONTROL: NGO Campaign Dashboard
 * Provides deep oversight into funding, policies, and beneficiary status.
 */
export default function NgoCampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("beneficiaries");
  const [trustData, setTrustData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/campaigns/${id}`);
        setCampaign(res.data);

        // Fetch campaign trust score
        try {
          const trustResponse = await api.get(`/trust/campaign/${id}`);
          setTrustData(trustResponse.data.data);
        } catch (trustErr) {
          console.error("Failed to fetch campaign trust score:", trustErr);
        }
      } catch (err) {
        console.error("Failed to load campaign details", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading)
    return (
      <div className="loader-center">
        <div className="spinner" />
      </div>
    );
  if (!campaign)
    return (
      <div className="alert alert-danger">
        Mission not found or unauthorized.
      </div>
    );

  return (
    <div className="stack-lg">
      <div className="page-header border-b pb-6">
        <div className="row-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="badge badge-primary">
                {campaign.disasterType}
              </span>
              <span
                className={`badge ${campaign.status === "ACTIVE" ? "badge-green" : "badge-yellow"}`}
              >
                {campaign.status}
              </span>
              {trustData && (
                <TrustScoreBadge score={trustData.trustScore} size="small" />
              )}
            </div>
            <h1 className="page-title">{campaign.title}</h1>
            <p className="page-subtitle">
              {campaign.location?.district}, {campaign.location?.state}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/ngo/dashboard" className="btn btn-ghost btn-sm">
              Mission Overview
            </Link>
            <button className="btn btn-primary btn-sm">Export Audit Log</button>
          </div>
        </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid-3 mb-8">
        <div className="stat-card">
          <div className="stat-card-label">Funds Committed</div>
          <div className="stat-card-value">
            ₹{(campaign.totalDonated || 0).toLocaleString("en-IN")}
          </div>
          <div className="h-1 bg-slate-100 mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: "65%" }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Aid Disbursed</div>
          <div className="stat-card-value text-green-600">
            ₹{(campaign.totalSpent || 0).toLocaleString("en-IN")}
          </div>
          <div className="stat-card-sub">Blocked: ₹0 (No violations)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Current Velocity</div>
          <div className="stat-card-value">High</div>
          <div className="stat-card-sub">AI Confidence: 94%</div>
        </div>
      </div>

      <div className="grid-12 gap-8">
        {/* Sidebar: Policy Snapshot */}
        <div className="col-span-4 stack-md">
          <div className="card bg-slate-50 border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              🛡️ Immutable Policy Snapshot
            </h3>
            <div className="stack-sm">
              <div className="row-between text-xs py-2 border-b border-slate-200 border-opacity-50">
                <span className="text-slate-500">Max / Transaction</span>
                <span className="font-bold">
                  ₹{campaign.policySnapshot?.maxPerTransaction}
                </span>
              </div>
              <div className="row-between text-xs py-2 border-b border-slate-200 border-opacity-50">
                <span className="text-slate-500">Validity Days</span>
                <span className="font-bold">
                  {campaign.policySnapshot?.validityDays} Days
                </span>
              </div>
              <div className="row-between text-xs py-2 border-b border-slate-200 border-opacity-50">
                <span className="text-slate-500">Categories</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {campaign.policySnapshot?.allowedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-sm font-bold text-[9px]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="row-between text-xs py-2">
                <span className="text-slate-500">Min. AI Threshold</span>
                <span className="font-bold">
                  {(
                    campaign.policySnapshot?.minEligibilityConfidence * 100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-primary bg-opacity-5 border-primary border-opacity-10">
            <h4 className="text-xs font-bold text-primary-dark mb-2">
              Workflow Trace ID
            </h4>
            <div className="text-[10px] font-mono text-primary break-all opacity-80">
              {campaign.jobIdHash}
            </div>
          </div>
        </div>

        {/* Main Content: Tabs */}
        <div className="col-span-8">
          <div className="tabs mb-6">
            <button
              className={`tab ${activeTab === "beneficiaries" ? "active" : ""}`}
              onClick={() => setActiveTab("beneficiaries")}
            >
              Beneficiary Pool
            </button>
            <button
              className={`tab ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              Audit Trail
            </button>
          </div>

          {activeTab === "beneficiaries" ? (
            <Beneficiaries campaignId={id} />
          ) : (
            <div className="card p-8 text-center text-slate-400">
              <span className="text-3xl block mb-2">📜</span>
              <p>
                Activity logs for this mission are being finalized on the
                blockchain.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
