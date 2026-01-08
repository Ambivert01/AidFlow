import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";

export default function ManageCampaign() {
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load campaign + beneficiaries
  const load = async () => {
    setLoading(true);
    const [campaignRes, benRes] = await Promise.all([
      api.get(`/campaigns/${id}`),
      api.get(`/ngo/beneficiaries`, { params: { campaignId: id } }),
    ]);

    setCampaign(campaignRes.data);
    setBeneficiaries(benRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  // ACTIVATE CAMPAIGN (policy lock)
  const activateCampaign = async () => {
    if (!window.confirm("Activate campaign? Policy will be locked forever."))
      return;

    await api.post(`/campaigns/${id}/activate`);
    alert("Campaign activated");
    load();
  };

  if (loading) return <Loader text="Loading campaign..." />;

  return (
    <div className="space-y-6">
      {/* CAMPAIGN HEADER */}
      <div className="bg-white border p-4 rounded">
        <h2 className="text-xl font-bold">{campaign.title}</h2>
        <p className="text-sm text-gray-500">{campaign.disasterType}</p>

        <div className="mt-3 flex items-center gap-3">
          <StatusBadge status={campaign.status} />

          {campaign.status === "DRAFT" && (
            <button
              onClick={activateCampaign}
              className="bg-green-700 text-white px-4 py-2 rounded"
            >
              Activate Campaign
            </button>
          )}
        </div>
      </div>

      {/* BENEFICIARIES */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Beneficiaries</h3>

        {beneficiaries.length === 0 && (
          <p className="text-gray-500">No beneficiaries registered yet</p>
        )}

        {beneficiaries.map((b) => (
          <div
            key={b._id}
            className="bg-white border p-3 rounded mb-2"
          >
            <p>User: {b.user}</p>
            <StatusBadge status={b.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
