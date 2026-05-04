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
        <div className="card shadow-sm border-0 bg-red-50 border-red-200">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <div className="text-lg font-bold text-red-800 mb-1">
                Failed to Load Dashboard
              </div>
              <div className="text-sm text-red-600">{error}</div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
            >
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
      <div className="page-header">
        <div>
          <h1 className="page-title">NGO Operations Dashboard</h1>
          <p className="page-subtitle">
            Unified view of campaigns, beneficiaries, wallets, and AI insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <div className="text-xs text-slate-500">
              Last updated:{" "}
              {lastRefresh.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {isStale && <span className="text-orange-600 ml-1">(Stale)</span>}
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <DashboardStats overview={dashboardData?.overview} />

      {/* Trust Score Section */}
      {trustData && (
        <div className="card shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Your Trust Score
            </h2>
            <TrustScoreBadge score={trustData.trustScore} size="large" />
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Your trust score is calculated based on proof validation, AI risk
            assessment, timeliness, fraud history, and activity consistency.
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
      <div className="card shadow-sm border-0 bg-slate-50">
        <h2 className="text-lg font-bold mb-4 text-slate-800">Quick Actions</h2>
        <div className="grid-3 gap-4">
          <Link to="/ngo/campaigns/create" className="action-button group">
            <div className="icon-box bg-blue-100 group-hover:bg-blue-600 transition-colors">
              <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                📋
              </span>
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Launch Campaign</div>
              <p className="text-[11px] text-slate-500 leading-tight mt-1">
                Deploy new aid funds with specific policies.
              </p>
            </div>
          </Link>

          <Link
            to="/ngo/beneficiaries/register"
            className="action-button group"
          >
            <div className="icon-box bg-emerald-100 group-hover:bg-emerald-600 transition-colors">
              <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                👤
              </span>
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800">Register Victims</div>
              <p className="text-[11px] text-slate-500 leading-tight mt-1">
                Onboard beneficiaries for AI validation.
              </p>
            </div>
          </Link>

          <Link
            to="/ngo/reviews"
            className="action-button group bg-primary bg-opacity-5 border-primary border-opacity-20"
          >
            <div className="icon-box bg-primary group-hover:bg-primary-dark transition-colors">
              <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                ⚖️
              </span>
            </div>
            <div className="text-left">
              <div className="font-bold text-primary-dark">
                Review & Disburse Aid
              </div>
              <p className="text-[11px] text-primary-dark opacity-70 leading-tight mt-1">
                Assign funds to approved beneficiaries.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Campaign Monitor and Beneficiary Overview */}
      <div className="grid-2 gap-8">
        <CampaignMonitor campaigns={dashboardData?.campaigns} />
        <BeneficiaryOverview beneficiaries={dashboardData?.beneficiaries} />
      </div>

      {/* Wallet Analytics and Proof Tracker */}
      <div className="grid-2 gap-8">
        <WalletAnalytics wallets={dashboardData?.wallets} />
        <ProofTracker proofs={dashboardData?.proofs} />
      </div>

      {/* AI Insights and Workflow Visualizer */}
      <div className="grid-2 gap-8">
        <AIInsights aiInsights={dashboardData?.aiInsights} />
        <WorkflowVisualizer workflow={dashboardData?.workflow} />
      </div>

      {/* Blockchain Status and Notifications */}
      <div className="grid-2 gap-8">
        <BlockchainStatus blockchain={dashboardData?.blockchain} />
        <NotificationPanel notifications={dashboardData?.notifications} />
      </div>
    </div>
  );
}
