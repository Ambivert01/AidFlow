import { useEffect, useState } from "react";
import { fetchCampaigns, donateToCampaign } from "../../services/donor.service";
import Loader from "../../components/Loader";

export default function Donate() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaigns()
      .then(res => setCampaigns(res.data))
      .catch(() => setError("Failed to load campaigns"))
      .finally(() => setLoading(false));
  }, []);

  const handleDonate = (campaignId) => {
    donateToCampaign({ campaignId, amount: 5000 })
      .then(() => alert("Donation successful"))
      .catch(() => alert("Donation failed"));
  };

  if (loading) return <Loader text="Loading campaigns..." />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Active Campaigns</h2>

      {campaigns.length === 0 && (
        <p className="text-gray-400">No active campaigns</p>
      )}

      {campaigns.map(c => (
        <div key={c._id} className="bg-white p-4 shadow rounded mb-4">
          <h3 className="font-semibold">{c.title}</h3>
          <p className="text-sm text-gray-500">{c.location}</p>

          <button
            onClick={() => handleDonate(c._id)}
            className="btn-primary mt-3"
          >
            Donate ₹5000
          </button>
        </div>
      ))}
    </div>
  );
}
