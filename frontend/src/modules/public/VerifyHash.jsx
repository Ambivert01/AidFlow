import { useState } from "react";
import { verifyAudit } from "../../services/donor.service";
import Loader from "../../components/Loader";

export default function VerifyHash() {
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = () => {
    setLoading(true);
    verifyAudit(jobId)
      .then(res => setResult(res.data))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Blockchain Verification</h2>

      <input
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
        placeholder="Enter Job ID"
        className="border p-2 w-full mb-3"
      />

      <button onClick={handleVerify} className="btn-primary">
        Verify
      </button>

      {loading && <Loader text="Verifying on blockchain..." />}

      {result && (
        <div className="bg-white p-4 shadow rounded mt-4">
          <p><b>Status:</b> Verified </p>
          <p><b>Tx Hash:</b> {result.txHash}</p>
          <p><b>Timestamp:</b> {result.timestamp}</p>
        </div>
      )}
    </div>
  );
}
