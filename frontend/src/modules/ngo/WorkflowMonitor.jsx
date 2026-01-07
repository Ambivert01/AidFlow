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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">
        Workflow Pipeline — Campaign {data.campaignId}
      </h2>

      {data.pipeline.map(p => (
        <div key={p.donationId} className="bg-white border p-4 rounded">
          <p className="font-semibold">Donation: {p.donationId}</p>

          <div className="flex flex-wrap gap-3 mt-3">
            {p.stages.map(s => (
              <StatusBadge
                key={s.stage}
                status={s.status}
              />
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
