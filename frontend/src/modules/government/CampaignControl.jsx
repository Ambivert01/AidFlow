// src/modules/government/CampaignControl.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function CampaignControl() {
  const [campaigns, setCampaigns] = useState([]);

  const load = () =>
    api.get("/government/campaigns").then(res => setCampaigns(res.data));

  useEffect(() => {
    load();
  }, []);

  const pause = (id) =>
    api.post(`/government/campaigns/${id}/pause`).then(load);

  const close = (id) =>
    api.post(`/government/campaigns/${id}/close`).then(load);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Campaign Control</h2>

      {campaigns.map(c => (
        <div key={c._id} className="bg-white p-4 rounded shadow mb-3">
          <p><b>{c.title}</b></p>
          <p>Status: {c.status}</p>

          <div className="flex gap-3 mt-2">
            <button onClick={() => pause(c._id)} className="btn-primary">
              Pause
            </button>
            <button onClick={() => close(c._id)} className="bg-red-600 text-white px-3 py-1 rounded">
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
