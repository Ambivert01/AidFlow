import api from "./api";

/** Government system overview stats */
export const getOverview = () => api.get("/government/overview");

/** Get all escalated high-risk donations */
export const getEscalated = () => api.get("/government/donations/escalated");

/** Approve an escalated donation */
export const approveDonation = (id) =>
  api.post(`/government/donations/${id}/approve`);

/** Reject an escalated donation */
export const rejectDonation = (id, reason) =>
  api.post(`/government/donations/${id}/reject`, { reason });

/** Get all wallets (paginated, filterable by status) */
export const getWallets = (params = {}) =>
  api.get("/government/wallets", { params });

/** Freeze a wallet */
export const freezeWallet = (walletId, reason) =>
  api.post("/government/wallets/freeze", { walletId, reason });

/** Unfreeze a wallet */
export const unfreezeWallet = (walletId) =>
  api.post("/government/wallets/unfreeze", { walletId });

/** Get all campaigns (filterable by status) */
export const getCampaigns = (params = {}) =>
  api.get("/government/campaigns", { params });

/** Pause a campaign */
export const pauseCampaign = (id, reason) =>
  api.post(`/government/campaigns/${id}/pause`, { reason });

/** Close a campaign */
export const closeCampaign = (id, reason) =>
  api.post(`/government/campaigns/${id}/close`, { reason });

/** Get fraud alerts (violations + frozen wallets) */
export const getFraudAlerts = () => api.get("/government/fraud-alerts");
