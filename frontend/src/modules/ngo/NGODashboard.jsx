import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import DashboardStats from "./components/DashboardStats";
import CampaignMonitor from "./components/CampaignMonitor";
import BeneficiaryOverview from "./components/BeneficiaryOverview";
import WalletAnalytics from "./components/WalletAnalytics";
import ProofTracker from "./components/ProofTracker";
import AIInsights from "./components/AIInsights";
import WorkflowVisualizer from "./components/WorkflowVisualizer";
import BlockchainStatus from "./components/BlockchainStatus";
import NotificationPanel from "./components/NotificationPanel";
import TrustScoreBadge from "../../components/common/TrustScoreBadge";
import TrustScoreGraph from "../../components/common/TrustScoreGraph";
import TrustFactorBreakdown from "../../components/common/TrustFactorBreakdown";

export default function NGODashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [trustData, setTrustData] = useState(null);
  const [ngoId, setNgoId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await api.get("/ngo/dashboard");
      const data = response.data?.data || response.data;
      setDashboardData(data);
      setLastRefresh(new Date());

      // Fetch NGO trust score
      if (data?.overview?.ngoId) {
        setNgoId(data.overview.ngoId);
        try {
          const trustResponse = await api.get(
            `/trust/ngo/${data.overview.ngoId}`,
          );
          setTrustData(trustResponse.data.data);
        } catch (trustErr) {
          console.error("Failed to fetch trust score:", trustErr);
        }
      }
    } catch (err) {
      console.error("NGO DASHBOARD ERROR:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: "40%" }} />
        </div>
        <DashboardStats overview={null} />
        <div className="grid-2 gap-8 mt-8">
          <CampaignMonitor campaigns={null} />
          <BeneficiaryOverview beneficiaries={null} />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="stack-lg">
        <div className="page-header">
          <h1 className="page-title">NGO Operations Dashboard</h1>
          <p className="page-subtitle">
            Manage campaigns, evaluate beneficiaries, and disburse smart aid.
          </p>
        </div>
        <div className="card" style={{ borderLeft: "3px solid var(--color-alert)", background: "var(--color-alert-light)" }}>
          <div className="flex items-center gap-4">
            <div className="stack-xs" style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--color-alert-dark)" }}>
                Failed to load dashboard
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-alert)" }}>{error}</div>
            </div>
            <button onClick={handleRefresh} className="btn btn-danger btn-sm">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate data staleness
  const isStale = lastRefresh && new Date() - lastRefresh > 5 * 60 * 1000; // 5 minutes

  return (
    <div className="stack-lg">
      {/* Header */}
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">NGO Operations Dashboard</h1>
          <p className="page-subtitle">
            Unified view of campaigns, beneficiaries, wallets, and AI insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <div style={{ fontSize: "12px", color: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }}>
              Updated{" "}
              {lastRefresh.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {isStale && <span style={{ color: "var(--color-caution)", marginLeft: "4px" }}>· stale</span>}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="animate-fade-up" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
        <DashboardStats overview={dashboardData?.overview} />
      </div>

      {/* Trust Score Section */}
      {trustData && (
        <div className="card animate-fade-up" style={{ borderTop: "3px solid var(--color-verified)", animationDelay: "60ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: 700 }}>
              Your trust score
            </h2>
            <TrustScoreBadge score={trustData.trustScore} size="large" />
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "var(--space-6)" }}>
            Calculated from proof validation, AI risk assessment, response timeliness, fraud history, and activity consistency — not self-reported.
          </p>
          <div className="grid-2 gap-6">
            {ngoId && (
              <TrustScoreGraph
                entityId={ngoId}
                entityType="ngo"
                timeRange={30}
              />
            )}
            {trustData.factors && (
              <TrustFactorBreakdown factors={trustData.factors} />
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, marginBottom: "var(--space-4)" }}>
          Quick actions
        </h2>
        <div className="grid-3 gap-4">
          <Link to="/ngo/campaigns/create" className="action-button">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--color-signal)", letterSpacing: "0.08em" }}>
              NEW
            </span>
            <div style={{ fontWeight: 700, color: "var(--color-text)" }}>Launch campaign</div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              Deploy new aid funds with specific policies.
            </p>
          </Link>

          <Link to="/ngo/beneficiaries/register" className="action-button">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--color-verified)", letterSpacing: "0.08em" }}>
              ONBOARD
            </span>
            <div style={{ fontWeight: 700, color: "var(--color-text)" }}>Register beneficiaries</div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
              Submit people for AI eligibility validation.
            </p>
          </Link>

          <Link
            to="/ngo/reviews"
            className="action-button"
            style={{ borderColor: "var(--color-signal)", background: "var(--color-signal-light)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--color-signal-dark)", letterSpacing: "0.08em" }}>
              ACTION NEEDED
            </span>
            <div style={{ fontWeight: 700, color: "var(--color-signal-dark)" }}>
              Review & disburse
            </div>
            <p style={{ fontSize: "12px", color: "var(--color-signal-dark)", opacity: 0.75, lineHeight: 1.4 }}>
              Assign funds to approved beneficiaries.
            </p>
          </Link>
        </div>
      </div>

      {/* Campaign Monitor and Beneficiary Overview */}
      <div className="grid-2 gap-8 animate-fade-up" style={{ animationDelay: "140ms", animationFillMode: "both" }}>
        <CampaignMonitor campaigns={dashboardData?.campaigns} />
        <BeneficiaryOverview beneficiaries={dashboardData?.beneficiaries} />
      </div>

      {/* Wallet Analytics and Proof Tracker */}
      <div className="grid-2 gap-8 animate-fade-up" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
        <WalletAnalytics wallets={dashboardData?.wallets} />
        <ProofTracker proofs={dashboardData?.proofs} />
      </div>

      {/* AI Insights and Workflow Visualizer */}
      <div className="grid-2 gap-8 animate-fade-up" style={{ animationDelay: "220ms", animationFillMode: "both" }}>
        <AIInsights aiInsights={dashboardData?.aiInsights} />
        <WorkflowVisualizer workflow={dashboardData?.workflow} />
      </div>

      {/* Blockchain Status and Notifications */}
      <div className="grid-2 gap-8 animate-fade-up" style={{ animationDelay: "260ms", animationFillMode: "both" }}>
        <BlockchainStatus blockchain={dashboardData?.blockchain} />
        <NotificationPanel notifications={dashboardData?.notifications} />
      </div>
    </div>
  );
}
