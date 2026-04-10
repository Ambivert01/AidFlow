import api from "./api";

// Get current user's beneficiary profile
export const getMyBeneficiary = () => api.get("/beneficiaries/me");

// Get wallet for current beneficiary
export const getMyWallet = () => api.get("/wallet/me");

// Get wallet transaction history
export const getMyTransactions = () => api.get("/wallet/transactions");

// Generate a JWT-signed QR token for a specific wallet
export const generateQR = (walletId) => api.post("/wallet/qr", { walletId });

// Get list of active campaigns beneficiary can apply to
export const getActiveCampaigns = () => api.get("/public/campaigns");

// Self-apply to a campaign
export const applyToCampaign = (campaignId) =>
  api.post("/beneficiaries", { campaignId });
