import { useEffect, useState } from "react";
import {
  fetchPendingDonations,
  approveDonation,
  rejectDonation,
} from "../../services/ngo.service";
import Loader from "../../components/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/StatusBadge";

export default function NGOReviewDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchPendingDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    await approveDonation(id);
    load();
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection?");
    if (!reason) return;
    await rejectDonation(id, reason);
    load();
  };

  if (loading) return <Loader text="Loading pending approvals..." />;

  if (donations.length === 0) {
    return (
      <EmptyState
        title="No pending reviews"
        description="All donations are processed."
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Donations Pending Review
      </h1>

      {donations.map((d) => (
        <div
          key={d._id}
          className="bg-white border rounded p-4 shadow-sm"
        >
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">
                ₹{d.amount}
              </p>
              <p className="text-sm text-gray-500">
                Campaign: {d.campaign?.title}
              </p>
              <p className="text-sm text-gray-500">
                Donor: {d.donor?.name || "Anonymous"}
              </p>
            </div>

            <StatusBadge status={d.status} />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleApprove(d._id)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(d._id)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
