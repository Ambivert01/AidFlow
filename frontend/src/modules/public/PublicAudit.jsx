import { useState } from "react";
import api from "../../services/api";

export default function PublicAudit() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyAudit = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit/${hash}`);
      setResult(res.data);
    } catch {
      setResult({ error: "Invalid or unknown audit hash" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Public Audit Verification
      </h1>

      {/* 🔍 Search */}
      <div className="border p-4 rounded">
        <input
          placeholder="Enter Audit Hash"
          className="border p-2 w-full mb-2"
          value={hash}
          onChange={e => setHash(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 w-full rounded"
          onClick={verifyAudit}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>

      {/* 📊 Result */}
      {result && (
        <div className="border p-4 rounded bg-gray-50">
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <>
              <p>
                <strong>Event:</strong> {result.eventType}
              </p>
              <p>
                <strong>Timestamp:</strong> {result.timestamp}
              </p>
              <p>
                <strong>Blockchain Tx:</strong> {result.txHash}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    result.verified
                      ? "text-green-600 font-bold"
                      : "text-red-600 font-bold"
                  }
                >
                  {result.verified ? "VERIFIED" : "TAMPERED"}
                </span>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
