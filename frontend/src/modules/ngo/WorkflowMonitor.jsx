import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";

export default function WorkflowMonitor() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ngo/workflow/${id}`)
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

if (loading) return <Loader text="Loading workflow pipeline..." />;
if (!data) return null;

return (
  <div className="space-y-6">
    <h2 className="text-xl font-bold">
      Workflow — Campaign {data.campaignId}
    </h2>

    {data.pipeline.length === 0 && (
      <p className="text-gray-500">No donations processed yet</p>
    )}

    {data.pipeline.map(p => (
      <div key={p.donationId} className="bg-white border p-4 rounded">
        <p className="font-semibold">Donation: {p.donationId}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          {p.stages.map(s => (
            <StatusBadge key={s.stage} status={s.stage + ": " + s.status} />
          ))}
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Audit finalized: {p.audit.finalized ? "YES" : "NO"} |
          On-chain: {p.audit.anchored ? "YES" : "NO"}
        </div>
      </div>
    ))}
  </div>
);

}
