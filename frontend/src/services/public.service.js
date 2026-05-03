import api from "./api";

/**
 * Public API Service
 * No authentication required for these endpoints
 */

/**
 * Get public homepage statistics
 */
export const getPublicStats = async () => {
  const response = await api.get("/public/stats");
  return response.data;
};

/**
 * Get public campaigns
 */
export const getPublicCampaigns = async (limit = 6) => {
  const response = await api.get(`/public/campaigns?limit=${limit}`);
  return response.data;
};

/**
 * Get campaign by ID (public view)
 */
export const getPublicCampaignById = async (id) => {
  const response = await api.get(`/public/campaigns/${id}`);
  return response.data;
};

/**
 * Get recent public transactions
 */
export const getRecentTransactions = async (limit = 10) => {
  const response = await api.get(`/public/recent-transactions?limit=${limit}`);
  return response.data;
};

/**
 * Get blockchain status
 */
export const getBlockchainStatus = async () => {
  const response = await api.get("/public/blockchain-status");
  return response.data;
};

/**
 * Verify audit trail by donation ID or jobIdHash
 */
export const verifyAudit = async (id) => {
  const response = await api.get(`/public/audit/verify/${id}`);
  return response.data;
};
