import { useState } from "react";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

export default function CampaignList({ campaigns, reload }) {
  const [submitting, setSubmitting] = useState(null);

  const submitForApproval = async (id) => {
    const confirm = window.confirm(
      "Submit this campaign for admin approval? You won't be able to edit it until it's reviewed.",
    );
    if (!confirm) return;

    try {
      setSubmitting(id);
      await api.post(`/campaigns/${id}/submit`);
      alert("Campaign submitted. Awaiting admin approval.");
      reload();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit campaign");
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      REJECTED: "bg-red-100 text-red-800",
      ACTIVE: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      DRAFT: "📝",
      PENDING_APPROVAL: "⏳",
      REJECTED: "❌",
      ACTIVE: "✅",
    };
    return icons[status] || "📄";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Campaigns</h3>

      {campaigns.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            No campaigns yet. Create your first campaign to get started.
          </p>
        </div>
      )}

      {campaigns.map((c) => (
        <div
          key={c._id}
          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getStatusIcon(c.status)}</span>
                <h4 className="font-semibold text-lg">{c.title}</h4>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Disaster Type:</span>{" "}
                  {c.disasterType}
                </p>
                <p>
                  <span className="font-medium">Target Amount:</span> ₹
                  {c.targetAmount?.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {c.location?.district}, {c.location?.state}
                </p>
                <p>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>

                {c.submittedAt && (
                  <p>
                    <span className="font-medium">Submitted:</span>{" "}
                    {new Date(c.submittedAt).toLocaleDateString()}
                  </p>
                )}

                {c.approvedAt && (
                  <p>
                    <span className="font-medium">Approved:</span>{" "}
                    {new Date(c.approvedAt).toLocaleDateString()}
                  </p>
                )}

                {c.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="font-medium text-red-800">
                      Rejection Reason:
                    </p>
                    <p className="text-red-700">{c.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 ml-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}
              >
                {c.status}
              </span>

              {c.status === "DRAFT" && (
                <button
                  onClick={() => submitForApproval(c._id)}
                  disabled={submitting === c._id}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting === c._id
                    ? "Submitting..."
                    : "Submit for Approval"}
                </button>
              )}

              {c.status === "PENDING_APPROVAL" && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 italic">
                    Awaiting admin review
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Cannot edit</p>
                </div>
              )}

              {c.status === "REJECTED" && (
                <button
                  onClick={() =>
                    (window.location.href = `/ngo/campaigns/${c._id}/edit`)
                  }
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                  Edit & Resubmit
                </button>
              )}

              {c.status === "ACTIVE" && (
                <div className="text-center">
                  <p className="text-xs text-green-600 font-medium">✓ Live</p>
                  <p className="text-xs text-gray-400 mt-1">Cannot edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
