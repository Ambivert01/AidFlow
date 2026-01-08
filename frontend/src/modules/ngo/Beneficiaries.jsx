import { useEffect, useState } from "react";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

export default function Beneficiaries({ campaignId }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/ngo/beneficiaries", {
      params: { campaignId },
    });
    setBeneficiaries(res.data);
  };

  useEffect(() => {
    load();
  }, [campaignId]);

  // Register beneficiary (link existing user)
  const addBeneficiary = async () => {
    if (!userId) return alert("User ID required");

    setLoading(true);
    try {
      await api.post("/ngo/beneficiaries", {
        userId,
        campaignId,
      });
      await load();
      setUserId("");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Duplicate or blocked beneficiary"
      );
    } finally {
      setLoading(false);
    }
  };

  const overrideDecision = async (id, decision) => {
    const reason = prompt("Reason (mandatory)");
    if (!reason) return;

    await api.post(`/ngo/beneficiaries/${id}/override`, {
      decision,
      reason,
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Beneficiaries</h2>

      {/* ADD BENEFICIARY */}
      <div className="border p-4 rounded bg-gray-50">
        <h3 className="font-semibold mb-2">
          Register Beneficiary (Existing User)
        </h3>

        <input
          placeholder="Beneficiary User ID"
          className="border p-2 w-full mb-3"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <button
          disabled={loading}
          onClick={addBeneficiary}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Evaluating via AI..." : "Register Beneficiary"}
        </button>
      </div>

      {/* BENEFICIARY LIST */}
      <div>
        <h3 className="font-semibold mb-3">Registered Beneficiaries</h3>

        {beneficiaries.map((b) => (
          <div
            key={b._id}
            className="border p-4 rounded mb-3 bg-white"
          >
            <div className="flex justify-between items-center">
              <p className="font-medium">
                User ID: {b.user}
              </p>
              <StatusBadge status={b.status} />
            </div>

            {/* AI DECISION */}
            {b.aiDecision && (
              <div className="mt-2 text-sm text-gray-700">
                <p>
                  AI Decision:{" "}
                  <b>{b.aiDecision.decision}</b>
                </p>
                <p>
                  Eligibility Confidence:{" "}
                  {b.aiDecision.eligibility.confidence}
                </p>
                <p>
                  Fraud Risk Score:{" "}
                  {b.aiDecision.fraud.riskScore}
                </p>
              </div>
            )}

            {/* NGO OVERRIDE */}
            {b.status === "ELIGIBLE" && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() =>
                    overrideDecision(b._id, "APPROVE")
                  }
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    overrideDecision(b._id, "REJECT")
                  }
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            )}

            {b.overrideByNgo && (
              <p className="text-xs text-gray-500 mt-2">
                NGO Decision: {b.overrideByNgo.decision} —{" "}
                {b.overrideByNgo.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
