import { useParams } from "react-router-dom";
import { startWorkflow, fetchWorkflowStatus } from "../../services/ngo.service";
import { useEffect, useState } from "react";
import Loader from "../../components/Loader";

export default function WorkflowMonitor() {
  const { id } = useParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = () =>
    fetchWorkflowStatus(id).then(res => setStatus(res.data));

  useEffect(() => {
    refresh();
  }, [id]);

  const trigger = () => {
    setLoading(true);
    startWorkflow(id)
      .then(refresh)
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">AidFlow Workflow</h2>

      <button onClick={trigger} className="btn-primary mb-4">
        Start AI Workflow
      </button>

      {loading && <Loader text="AI agents working..." />}

      {status && (
        <div className="bg-white p-4 shadow rounded">
          <p>Status: {status.state}</p>
          <p>Verified: {status.verifiedCount}</p>
          <p>Disbursed: {status.disbursedCount}</p>
        </div>
      )}
    </div>
  );
}
