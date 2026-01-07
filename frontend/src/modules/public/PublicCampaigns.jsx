import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import InfoNotice from "../../components/InfoNotice";

export default function PublicCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/public/campaigns")
      .then(res => setCampaigns(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        Active Relief Campaigns
      </h1>

      <InfoNotice
        title="Public Transparency"
        message="All campaigns shown below are read-only and publicly verifiable. Policies shown here are locked before funds are accepted."
      />

      {loading && <Loader text="Loading public campaigns…" />}

      {!loading && campaigns.length === 0 && (
        <div className="text-gray-500 text-sm">
          No active campaigns available at the moment.
        </div>
      )}

      {campaigns.map(c => (
        <div key={c.id} className="bg-white p-4 rounded shadow space-y-2">
          <p className="font-semibold">{c.title}</p>
          <p className="text-sm">NGO: {c.ngo}</p>
          <p className="text-sm">Disaster: {c.disasterType}</p>
          <p className="text-sm font-medium">
            Total Received: ₹{c.totalReceived}
          </p>

          <details className="mt-2">
            <summary className="cursor-pointer font-medium text-sm">
              Policy Snapshot (Locked)
            </summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(c.policy, null, 2)}
            </pre>
          </details>
        </div>
      ))}
    </div>
  );
}
