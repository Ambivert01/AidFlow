import api from "./api";

// Donor dashboard stats
export const getDonorDashboard = () => api.get("/donations/dashboard");

// Donor's own donations (populated)
export const fetchMyDonations = () => api.get("/donations/my");

// All active campaigns (public)
export const fetchCampaigns = () => api.get("/public/campaigns");

/**
 * Donate to a campaign with idempotency support
 * @param {Object} data - Donation data
 * @param {String} data.campaignId - Campaign ID
 * @param {Number} data.amount - Donation amount
 * @param {String} data.idempotencyKey - Unique idempotency key (optional but recommended)
 * @returns {Promise} - API response
 */
export const donateToCampaign = (data) => {
  const { idempotencyKey, ...donationData } = data;

  // Prepare headers with idempotency key if provided
  const config = {};
  if (idempotencyKey) {
    config.headers = {
      "Idempotency-Key": idempotencyKey,
    };
  }

  return api.post("/donations", donationData, config);
};

// Public audit verification
export const verifyAudit = (id) => api.get(`/public/audit/verify/${id}`);
