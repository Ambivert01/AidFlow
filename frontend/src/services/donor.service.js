import api from "./api";


// Fetch all active campaigns

export const fetchCampaigns = async () => {
  const res = await api.get("/campaigns");
  return res.data;
};

export const fetchMyDonations = () =>
  api.get("/donor/donations");


// Donate to a campaign

export const donateToCampaign = (data) =>
  api.post("/donations", data);


// Fetch logged-in donor donation history

export const fetchDonationHistory = () =>
  api.get("/donations/my");


// Fetch timeline for a specific donation

export const fetchDonationTimeline = (donationId) =>
  api.get(`/donations/${donationId}/timeline`);


// Verify blockchain audit

export const verifyAudit = (jobId) =>
  api.get(`/audit/verify/${jobId}`);
