import { useEffect, useState } from "react";
import { fetchNgoCampaigns } from "../../services/ngo.service";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";

export default function NgoDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNgoCampaigns()
      .then(res => setCampaigns(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading NGO campaigns..." />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Campaigns</h2>

      <Link
        to="/ngo/create"
        className="btn-primary inline-block mb-4"
      >
        + Create Campaign
      </Link>

      {campaigns.map(c => (
        <div key={c._id} className="bg-white p-4 shadow rounded mb-3">
          <h3 className="font-semibold">{c.title}</h3>
          <p className="text-sm text-gray-500">{c.location}</p>

          <div className="flex gap-4 mt-3">
            <Link to={`/ngo/campaign/${c._id}`} className="text-blue-600">
              Manage
            </Link>
            <Link to={`/ngo/workflow/${c._id}`} className="text-green-600">
              Workflow
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
