import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import InfoNotice from "../../components/InfoNotice";

export default function DonationTimeline() {
  const { jobIdHash } = useParams();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/audit/timeline/${jobIdHash}`)
      .then((res) => setTimeline(res.data.timeline))
      .finally(() => setLoading(false));
  }, [jobIdHash]);

  if (loading) return <Loader text="Loading audit timeline…" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <InfoNotice
        title="Immutable Audit Timeline"
        message="This timeline is generated from cryptographically chained audit logs. It cannot be altered."
      />

      <h2 className="text-xl font-bold">Donation Timeline</h2>

      <div className="border-l-2 border-blue-600 pl-6 space-y-6">
        {timeline.map((e, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-3 top-1 h-3 w-3 bg-blue-600 rounded-full"></span>

            <p className="font-medium">{e.event.replaceAll("_", " ")}</p>
            <p className="text-xs text-gray-500">
              {new Date(e.timestamp).toLocaleString()} — {e.actor}
            </p>

            {e.payload && (
              <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
