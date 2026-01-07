import RoleContextBanner from "../../components/RoleContextBanner";
import InfoNotice from "../../components/InfoNotice";

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
    try {
      await approveDonation(id);
      alert("Approved successfully");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Approve failed");
      console.error(err);
    }
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
      <>
        <RoleContextBanner
          role="NGO"
          message="There are no donations requiring your review at the moment."
        />

        <InfoNotice
          title="Why reviews happen"
          message="Donations reach this stage only when AI or policy rules detect ambiguity or elevated risk. Your decision is permanently audited."
        />

        <EmptyState
          title="No pending reviews"
          description="All donations are currently processed."
        />
      </>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <RoleContextBanner
        role="NGO"
        message="Review flagged donations and approve or reject them."
      />

      <InfoNotice
        title="Legal & Financial Responsibility"
        message="Approving a donation permanently releases funds into a beneficiary wallet. This action is irreversible, recorded on blockchain, and publicly auditable."
      />

      <InfoNotice
        title="Why reviews happen"
        message="Donations reach this stage only when AI or policy rules detect ambiguity or elevated risk. Your decision is permanently audited."
      />

      {donations
        .filter((d) => d.status === "PENDING_NGO_REVIEW")
        .map((d) => (
          <div key={d._id} className="bg-white border rounded p-4 shadow-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">₹{d.amount}</p>
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
