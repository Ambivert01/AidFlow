import { useState, useEffect } from "react";
import api from "../../services/api";

export default function PendingCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectingCampaign, setRejectingCampaign] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPendingCampaigns();
  }, []);

  const fetchPendingCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/campaigns/pending");
      setCampaigns(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch pending campaigns:", error);
      alert(
        error.response?.data?.message || "Failed to fetch pending campaigns",
      );
    } finally {
      setLoading(false);
    }
  };

  const approveCampaign = async (campaignId) => {
    const confirm = window.confirm(
      "Approve this campaign? It will become ACTIVE and visible to donors.",
    );
    if (!confirm) return;

    try {
      setActionLoading(campaignId);
      await api.post(`/admin/campaigns/${campaignId}/approve`);
      alert("Campaign approved successfully");
      fetchPendingCampaigns();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to approve campaign");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (campaignId) => {
    setRejectingCampaign(campaignId);
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    setRejectingCampaign(null);
    setRejectionReason("");
  };

  const rejectCampaign = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(rejectingCampaign);
      await api.post(`/admin/campaigns/${rejectingCampaign}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      alert("Campaign rejected");
      closeRejectModal();
      fetchPendingCampaigns();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject campaign");
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return "text-red-600 bg-red-50 border-red-200";
    if (riskScore >= 40)
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getRiskLabel = (riskScore) => {
    if (riskScore >= 70) return "⚠️ High Risk";
    if (riskScore >= 40) return "⚡ Medium Risk";
    return "✓ Low Risk";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading pending campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Campaign Approvals</h2>
        <button
          onClick={fetchPendingCampaigns}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {campaigns.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No pending campaigns to review</p>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign._id}
            className={`bg-white border-2 rounded-lg p-6 ${
              campaign.aiRiskScore >= 70 ? "border-red-300" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">NGO:</span>{" "}
                      {campaign.createdBy?.name || "Unknown"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Disaster Type:</span>{" "}
                      {campaign.disasterType}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Target Amount:</span> ₹
                      {campaign.targetAmount?.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span>{" "}
                      {campaign.location?.district}, {campaign.location?.state}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Submitted:</span>{" "}
                      {new Date(campaign.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {campaign.aiRiskScore !== undefined && (
                <div
                  className={`px-4 py-2 rounded-lg border-2 font-medium text-sm ${getRiskColor(
                    campaign.aiRiskScore,
                  )}`}
                >
                  {getRiskLabel(campaign.aiRiskScore)}
                  <div className="text-xs mt-1">
                    Score: {campaign.aiRiskScore}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="text-gray-700 text-sm">
                <span className="font-medium">Description:</span>{" "}
                {campaign.description}
              </p>
            </div>

            {campaign.aiFlags && campaign.aiFlags.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-medium text-yellow-800 text-sm mb-1">
                  AI Flags:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {campaign.aiFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
              <p className="font-medium text-gray-800 text-sm mb-2">
                Policy Rules:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <p>
                  <span className="font-medium">Max per Beneficiary:</span> ₹
                  {campaign.policySnapshot?.maxPerBeneficiary?.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Max per Transaction:</span> ₹
                  {campaign.policySnapshot?.maxPerTransaction?.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Validity:</span>{" "}
                  {campaign.policySnapshot?.validityDays} days
                </p>
                <p>
                  <span className="font-medium">Allowed Categories:</span>{" "}
                  {campaign.policySnapshot?.allowedCategories?.join(", ")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => approveCampaign(campaign._id)}
                disabled={actionLoading === campaign._id}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === campaign._id
                  ? "Processing..."
                  : "✓ Approve Campaign"}
              </button>

              <button
                onClick={() => openRejectModal(campaign._id)}
                disabled={actionLoading === campaign._id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ✗ Reject Campaign
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {rejectingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Campaign</h3>

            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this campaign. The NGO will
              see this message.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={closeRejectModal}
                disabled={actionLoading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={rejectCampaign}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
