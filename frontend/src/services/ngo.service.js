import api from "./api";

// NGO dashboard stats
export const getNgoDashboard = () => api.get("/ngo/dashboard");

// NGO's own campaigns
export const fetchNgoCampaigns = () => api.get("/ngo/campaigns");

// Create campaign
export const createCampaign = (data) => api.post("/campaigns", data);

// Pending donations for NGO review
export const fetchPendingDonations = () => api.get("/ngo/donations/pending");

// Assign beneficiary to donation
export const assignBeneficiaryToDonation = (donationId, beneficiaryId) =>
  api.post(`/ngo/donations/${donationId}/assign`, { beneficiaryId });

// Approve donation (creates wallet)
export const approveDonation = (donationId) =>
  api.post(`/ngo/donations/${donationId}/approve`);

// Reject donation
export const rejectDonation = (donationId, reason) =>
  api.post(`/ngo/donations/${donationId}/reject`, { reason });

// NGO beneficiaries (all campaigns, optional status filter)
export const fetchNgoBeneficiaries = (params = {}) =>
  api.get("/ngo/beneficiaries", { params });

// Campaign beneficiaries
export const fetchBeneficiaries = (campaignId) =>
  api.get(`/ngo/beneficiaries/${campaignId}`);

// Register beneficiary
export const addBeneficiary = (data) => api.post("/beneficiaries", data);
