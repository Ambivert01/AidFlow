import { useState } from "react";
import api from "../../services/api";

export default function PublicAudit() {
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyAudit = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/audit/verify/${jobId}`);
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Public Audit Verification
      </h1>

      {/* Input */}
      <div className="border p-4 rounded bg-white space-y-3">
        <input
          placeholder="Enter Donation / Job ID"
          className="border p-2 w-full rounded"
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
        />

        <button
          onClick={verifyAudit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 w-full rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="border p-4 rounded bg-gray-50 space-y-3">
          <p>
            <strong>Status:</strong>{" "}
            {result.valid ? "VERIFIED" : "NOT VERIFIED"}
          </p>

          <p>
            <strong>Merkle Root:</strong>
            <br />
            <span className="break-all text-sm">
              {result.merkleRoot}
            </span>
          </p>

          <p>
            <strong>Blockchain Tx:</strong>
            <br />
            <span className="break-all text-sm">
              {result.blockchainTxHash}
            </span>
          </p>

          <h3 className="font-semibold mt-4">
            Audit Timeline
          </h3>

          <ul className="list-disc pl-5 text-sm space-y-1">
            {result.events.map((e, i) => (
              <li key={i}>
                <strong>{e.eventType}</strong> —{" "}
                {new Date(e.timestamp).toLocaleString()} (
                {e.actorRole})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
