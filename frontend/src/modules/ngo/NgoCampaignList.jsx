import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function NgoCampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/campaigns/ngo")
      .then(res => setCampaigns(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading campaigns..." />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My Campaigns</h2>

      {campaigns.map(c => (
        <div key={c._id} className="bg-white p-4 rounded shadow">
          <p className="font-semibold">{c.title}</p>
          <p className="text-sm text-gray-500">{c.status}</p>

          <div className="flex gap-4 mt-3">
            <Link
              to={`/ngo/campaign/${c._id}`}
              className="text-blue-600 text-sm"
            >
              Manage
            </Link>

            <Link
              to={`/ngo/workflow/${c._id}`}
              className="text-green-600 text-sm"
            >
              Workflow
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
