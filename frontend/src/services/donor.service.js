import api from "./api";

// Donor dashboard stats
export const getDonorDashboard = () => api.get("/donations/dashboard");

// Donor's own donations (populated)
export const fetchMyDonations = () => api.get("/donations/my");

// All active campaigns (public)
export const fetchCampaigns = () => api.get("/public/campaigns");

// Donate to a campaign
export const donateToCampaign = (data) => api.post("/donations", data);

// Public audit verification
export const verifyAudit = (id) => api.get(`/public/audit/verify/${id}`);
