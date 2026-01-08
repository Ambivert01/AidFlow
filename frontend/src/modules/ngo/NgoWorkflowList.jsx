import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function NgoWorkflowList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/campaigns/ngo")
      .then(res => setCampaigns(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading workflows..." />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Workflow Monitor</h2>

      {campaigns.length === 0 && (
        <p className="text-gray-500">No campaigns available</p>
      )}

      {campaigns.map(c => (
        <div
          key={c._id}
          className="bg-white border p-4 rounded flex justify-between"
        >
          <div>
            <p className="font-semibold">{c.title}</p>
            <p className="text-sm text-gray-500">
              Status: {c.status}
            </p>
          </div>

          <Link
            to={`/ngo/workflow/${c._id}`}
            className="text-blue-600 hover:underline"
          >
            View Workflow →
          </Link>
        </div>
      ))}
    </div>
  );
}
