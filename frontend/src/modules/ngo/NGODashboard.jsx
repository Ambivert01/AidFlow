import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";

import { useEffect, useState } from "react";
import { fetchNgoCampaigns } from "../../services/ngo.service";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import api from "../../services/api";

export default function NgoDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const activateCampaign = async (campaignId) => {
    try {
      await api.post(`/campaigns/${campaignId}/activate`);
      // refresh campaigns
      const res = await fetchNgoCampaigns();
      setCampaigns(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to activate campaign");
    }
  };

  useEffect(() => {
    fetchNgoCampaigns()
      .then((res) => setCampaigns(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading NGO campaigns..." />;

  return (
    <div>
      <RoleContextBanner
        role="NGO"
        message="Create and manage relief campaigns. Review donations flagged for approval."
      />
      <h2 className="text-xl font-bold mb-4">My Campaigns</h2>

      <Link to="/ngo/create" className="btn-primary inline-block mb-4">
        + Create Campaign
      </Link>

      {campaigns.length === 0 && (
        <InfoNotice
          title="No campaigns created"
          message="Create a relief campaign to begin receiving donations and distributing aid."
        />
      )}

      {campaigns.map((c) => (
        <div key={c._id} className="bg-white p-4 shadow rounded mb-3">
          <h3 className="font-semibold">{c.title}</h3>
          <p className="text-sm text-gray-500">{c.location}</p>

          <div className="flex items-center gap-4 mt-3">
            {/* Status */}
            <span className="text-sm px-2 py-1 rounded bg-gray-100">
              Status: <b>{c.status}</b>
            </span>

            <Link to={`/ngo/campaign/${c._id}`} className="text-blue-600">
              Manage
            </Link>

            <Link to={`/ngo/workflow/${c._id}`} className="text-green-600">
              Workflow
            </Link>

            {/* Activate button only for DRAFT */}
            {c.status === "DRAFT" && (
              <button
                onClick={() => activateCampaign(c._id)}
                className="ml-auto px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700"
              >
                Activate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
