import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import RoleContextBanner from "../../components/RoleContextBanner";
import NgoSummaryGrid from "./components/NgoSummaryGrid";
import InfoNotice from "../../components/InfoNotice";
import { Link } from "react-router-dom";
import CampaignList from "./CampaignList";

export default function NGODashboard() {
  const [data, setData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = async () => {
    const res = await api.get("/campaigns/ngo");
    setCampaigns(res.data);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [dashboardRes, campaignsRes] = await Promise.all([
          api.get("/ngo/dashboard"),
          api.get("/campaigns/ngo"),
        ]);

        if (!mounted) return;

        setData(dashboardRes.data);
        setCampaigns(campaignsRes.data);
      } catch (err) {
        console.error("NGO dashboard load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader text="Loading NGO control tower..." />;

  return (
    <div className="space-y-6">
      <RoleContextBanner
        role="NGO"
        message="This dashboard reflects your operational accountability across campaigns, donations, audits, and compliance."
      />

      <InfoNotice
        title="Governance Notice"
        message="All figures shown here are derived from immutable audit logs and AI workflow outputs. No manual overrides are possible."
      />

      <NgoSummaryGrid data={data} />

      <CampaignList campaigns={campaigns} reload={loadCampaigns} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Link
          to="/ngo/create"
          className="bg-blue-600 text-white p-4 rounded text-center hover:bg-blue-700"
        >
          Create Campaign
        </Link>

        <Link
          to="/ngo/campaigns"
          className="bg-indigo-600 text-white p-4 rounded text-center hover:bg-indigo-700"
        >
          Manage Campaigns
        </Link>

        <Link
          to="/ngo/reviews"
          className="bg-yellow-600 text-white p-4 rounded text-center hover:bg-yellow-700"
        >
          Review Flagged Donations
        </Link>

        <Link
          to="/ngo/workflow"
          className="bg-green-600 text-white p-4 rounded text-center hover:bg-green-700"
        >
          Workflow Monitor
        </Link>
      </div>
    </div>
  );
}
