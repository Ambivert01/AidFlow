import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

export default function CampaignList({ campaigns, reload }) {
  const activate = async (id) => {
    const confirm = window.confirm(
      "Activating this campaign will LOCK policy forever. Continue?"
    );
    if (!confirm) return;

    await api.post(`/campaigns/${id}/activate`);
    alert("Campaign activated");
    reload();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Campaigns</h3>

      {campaigns.map((c) => (
        <div
          key={c._id}
          className="bg-white border rounded p-4 flex justify-between items-center"
        >
          <div>
            <p className="font-medium">{c.title}</p>
            <p className="text-sm text-gray-500">{c.disasterType}</p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={c.status} />

            {c.status === "DRAFT" && (
              <button
                onClick={() => activate(c._id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
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
