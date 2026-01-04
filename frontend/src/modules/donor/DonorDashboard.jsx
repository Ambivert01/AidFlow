import { useEffect, useState } from "react";
import { fetchCampaigns } from "../../services/donor.service";
import Donate from "./Donate";

export default function DonorDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchCampaigns().then(setCampaigns);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Active Campaigns</h1>

      {campaigns.map(c => (
        <div key={c._id} className="border p-4 rounded">
          <h2 className="font-semibold">{c.title}</h2>
          <p>{c.description}</p>
          <p className="text-sm">
            Collected: ₹{c.collectedAmount} / ₹{c.targetAmount}
          </p>

          <button
            className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
            onClick={() => setSelected(c)}
          >
            Donate
          </button>
        </div>
      ))}

      {selected && <Donate campaign={selected} />}
    </div>
  );
}
