import api from "./api";

export const getOverview = () => api.get("/government/overview");
export const getEscalated = () => api.get("/government/donations/escalated");
export const approveDonation = (id) => api.post(`/government/donations/${id}/approve`);
export const rejectDonation = (id, reason) => api.post(`/government/donations/${id}/reject`, { reason });
export const getWallets = (params = {}) => api.get("/government/wallets", { params });
export const freezeWallet = (walletId, reason) => api.post("/government/wallets/freeze", { walletId, reason });
export const unfreezeWallet = (walletId) => api.post("/government/wallets/unfreeze", { walletId });
export const getCampaigns = (params = {}) => api.get("/government/campaigns", { params });
export const pauseCampaign = (id, reason) => api.post(`/government/campaigns/${id}/pause`, { reason });
export const closeCampaign = (id, reason) => api.post(`/government/campaigns/${id}/close`, { reason });
export const getFraudAlerts = () => api.get("/government/fraud-alerts");
