import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function DisasterControl() {
  const [campaigns, setCampaigns] = useState(null);

  const load = () =>
    api.get("/government/campaigns").then(res => setCampaigns(res.data));

  useEffect(() => {
    load();
  }, []);

  if (!campaigns) return <Loader text="Loading disaster control..." />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Disaster Control</h2>

      {campaigns.map(c => (
        <div key={c._id} className="bg-white p-4 shadow rounded">
          <p className="font-semibold">{c.title}</p>
          <p className="text-sm text-gray-500">{c.disasterType}</p>
          <p>Status: <b>{c.status}</b></p>

          <div className="flex gap-3 mt-3">
            {c.status === "ACTIVE" && (
              <button
                onClick={() =>
                  api.post(`/government/campaigns/${c._id}/pause`).then(load)
                }
                className="btn-warning"
              >
                Pause
              </button>
            )}

            <button
              onClick={() =>
                api.post(`/government/campaigns/${c._id}/close`).then(load)
              }
              className="btn-danger"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
