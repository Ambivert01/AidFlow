import React, { useState, useEffect } from "react";
import axios from "axios";
import TrustScoreBadge from "../components/common/TrustScoreBadge";
import Loader from "../components/Loader";

/**
 * TrustRankingPage Component
 * Public page displaying top trusted NGOs and Campaigns
 */
const TrustRankingPage = () => {
  const [activeTab, setActiveTab] = useState("ngo");
  const [ngos, setNgos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopTrusted();
  }, []);

  const fetchTopTrusted = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ngosResponse, campaignsResponse] = await Promise.all([
        axios.get("/api/trust/top/ngo?limit=20"),
        axios.get("/api/trust/top/campaign?limit=20"),
      ]);

      setNgos(ngosResponse.data.data);
      setCampaigns(campaignsResponse.data.data);
    } catch (err) {
      console.error("Error fetching trust rankings:", err);
      setError("Failed to load trust rankings");
    } finally {
      setLoading(false);
    }
  };

  const renderNGOList = () => {
    if (ngos.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No NGOs found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ngos.map((ngo, index) => (
          <div
            key={ngo._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                      ${index === 0 ? "bg-yellow-100 text-yellow-700" : ""}
                      ${index === 1 ? "bg-gray-100 text-gray-700" : ""}
                      ${index === 2 ? "bg-orange-100 text-orange-700" : ""}
                      ${index > 2 ? "bg-blue-50 text-blue-600" : ""}
                    `}
                  >
                    #{index + 1}
                  </div>
                </div>

                {/* NGO Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {ngo.name}
                  </h3>
                  <p className="text-sm text-gray-500">{ngo.email}</p>
                </div>

                {/* Trust Score */}
                <div className="flex-shrink-0">
                  <TrustScoreBadge score={ngo.trustScore} size="large" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCampaignList = () => {
    if (campaigns.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No campaigns found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {campaigns.map((campaign, index) => (
          <div
            key={campaign._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Rank */}
                <div className="flex-shrink-0">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                      ${index === 0 ? "bg-yellow-100 text-yellow-700" : ""}
                      ${index === 1 ? "bg-gray-100 text-gray-700" : ""}
                      ${index === 2 ? "bg-orange-100 text-orange-700" : ""}
                      ${index > 2 ? "bg-blue-50 text-blue-600" : ""}
                    `}
                  >
                    #{index + 1}
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {campaign.description}
                  </p>
                </div>

                {/* Trust Score */}
                <div className="flex-shrink-0">
                  <TrustScoreBadge score={campaign.trustScore} size="large" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTopTrusted}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Trust Rankings</h1>
          <p className="mt-2 text-gray-600">
            Discover the most trusted NGOs and campaigns based on transparency,
            proof validation, and fraud-free operations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("ngo")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "ngo"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Top NGOs
            </button>
            <button
              onClick={() => setActiveTab("campaign")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "campaign"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              Top Campaigns
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "ngo" ? renderNGOList() : renderCampaignList()}
      </div>

      {/* Info Box */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How Trust Scores Work
          </h3>
          <p className="text-blue-800 mb-4">
            Trust scores are calculated based on multiple factors to ensure
            transparency and accountability:
          </p>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">
                Proof Validation (40%):
              </span>
              <span>
                Verified proofs increase trust, rejected proofs decrease it
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">
                AI Risk (25%):
              </span>
              <span>
                Low fraud risk increases trust, high risk decreases it
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">
                Timeliness (15%):
              </span>
              <span>On-time proof uploads increase trust</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">
                Fraud History (10%):
              </span>
              <span>Fraud alerts decrease trust</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[120px]">
                Consistency (10%):
              </span>
              <span>Regular activity increases trust</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TrustRankingPage;
