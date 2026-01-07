import api from "./api";

// Fetch all active campaigns
export const fetchCampaigns = async () => {
  const res = await api.get("/campaigns");
  return res.data;
};

// Fetch donor donations (single source of truth)
export const fetchMyDonations = () =>
  api.get("/donor/donations");

// Donate to a campaign
export const donateToCampaign = (data) =>
  api.post("/donations", data);

// Public audit verification
export const verifyAudit = (jobId) =>
  api.get(`/audit/verify/${jobId}`);
