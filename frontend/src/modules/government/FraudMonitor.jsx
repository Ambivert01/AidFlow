import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";

export default function FraudMonitor() {
  const [cases, setCases] = useState(null);

  const load = () =>
    api.get("/government/donations/escalated")
      .then(res => setCases(res.data));

  useEffect(() => {
    load();
  }, []);

  if (!cases) return <Loader text="Loading fraud cases..." />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Fraud Monitor</h2>

      {cases.length === 0 && (
        <p className="text-gray-500">No escalated cases</p>
      )}

      {cases.map(d => (
        <div key={d._id} className="bg-white p-4 shadow rounded">
          <p><b>₹{d.amount}</b> — {d.campaign?.title}</p>
          <StatusBadge status={d.status} />

          <div className="flex gap-3 mt-3">
            <button
              onClick={() =>
                api.post(`/government/donations/${d._id}/approve`).then(load)
              }
              className="btn-primary"
            >
              Approve
            </button>

            <button
              onClick={() =>
                api.post(`/government/donations/${d._id}/reject`, {
                  reason: "Fraud suspected",
                }).then(load)
              }
              className="btn-danger"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
