import { useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function PublicAudit() {
  const [jobIdHash, setJobIdHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyAudit = async () => {
    if (!jobIdHash.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/audit/verify/${jobIdHash.trim()}`);
      setResult(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "No audit found for this ID. Please check the Audit ID and try again."
      );
    } finally {
      setLoading(false); // 🔑 FIX infinite processing
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">
          Public Audit Verification
        </h1>

        <p className="text-sm text-slate-600">
          Verify the integrity of a disaster relief donation workflow.
        </p>

        <p className="text-xs text-slate-500">
          You only need the <b>Donation Audit ID</b> (shared with the donor).
        </p>
      </div>

      {/* INPUT */}
      <div className="bg-white border p-4 rounded space-y-3">
        <label className="text-sm font-medium">
          Donation Audit ID
        </label>

        <input
          className="border p-2 w-full rounded text-sm"
          placeholder="Example: 65a9f1d8c2a4e9b6c8d12345"
          value={jobIdHash}
          onChange={(e) => setJobIdHash(e.target.value)}
        />

        <button
          onClick={verifyAudit}
          disabled={loading}
          className="bg-blue-700 text-white w-full py-2 rounded hover:bg-blue-800"
        >
          {loading ? "Verifying audit…" : "Verify Audit"}
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center">
          <Loader text="Checking audit integrity…" />
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="bg-gray-50 border p-4 rounded space-y-4">

          {/* STATUS */}
          <div>
            <p className="font-semibold">
              Verification Status:{" "}
              <span
                className={
                  result.valid
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                {result.valid ? "VERIFIED" : "NOT VERIFIED"}
              </span>
            </p>
          </div>

          {/* MERKLE ROOT */}
          <div>
            <p className="text-sm font-medium">
              Merkle Root (Audit Proof)
            </p>
            <p className="text-xs break-all text-slate-700">
              {result.merkleRoot}
            </p>
          </div>

          {/* BLOCKCHAIN */}
          <div>
            <p className="text-sm font-medium">
              Blockchain Anchor
            </p>
            <p className="text-xs break-all text-slate-700">
              {result.blockchainTxHash || "Not anchored yet"}
            </p>
          </div>

          {/* TIMELINE */}
          <div>
            <p className="text-sm font-medium mb-2">
              Audit Timeline
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              {result.events.map((e, i) => (
                <li key={i}>
                  <b>{e.eventType}</b> —{" "}
                  {new Date(e.timestamp).toLocaleString()} (
                  {e.actorRole})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
