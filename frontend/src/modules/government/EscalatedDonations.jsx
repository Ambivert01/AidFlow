// src/modules/government/EscalatedDonations.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import StatusBadge from "../../components/StatusBadge";
import RoleContextBanner from "../../components/RoleContextBanner";

export default function EscalatedDonations() {
  const [donations, setDonations] = useState(null);

  const load = () =>
    api.get("/government/donations/escalated").then(res => setDonations(res.data));

  useEffect(() => {
    load();
  }, []);

  if (!donations) return <Loader text="Loading escalated cases..." />;

  if (donations.length === 0) {
    return <p className="text-gray-500">No escalated cases.</p>;
  }

  const approve = async (id) => {
    await api.post(`/government/donations/${id}/approve`);
    load();
  };

  const reject = async (id) => {
    const reason = prompt("Rejection reason (mandatory):");
    if (!reason) return;
    await api.post(`/government/donations/${id}/reject`, { reason });
    load();
  };

  return (
    <div className="space-y-6">
      <RoleContextBanner
        role="GOVERNMENT"
        message="High-risk donations flagged by AI require your decision."
      />

      {donations.map(d => (
        <div key={d._id} className="bg-white p-4 rounded shadow">
          <p><b>Amount:</b> ₹{d.amount}</p>
          <p><b>Campaign:</b> {d.campaign?.title}</p>
          <p><b>Donor:</b> {d.donor?.name || "Anonymous"}</p>
          <p><b>Beneficiary:</b> {d.beneficiary?.name}</p>

          <StatusBadge status={d.status} />

          <div className="flex gap-3 mt-3">
            <button
              onClick={() => approve(d._id)}
              className="bg-green-600 text-white px-4 py-1 rounded"
            >
              Approve
            </button>
            <button
              onClick={() => reject(d._id)}
              className="bg-red-600 text-white px-4 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
