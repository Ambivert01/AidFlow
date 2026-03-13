import api from "./api";

/** Get platform system stats */
export const getStats = () => api.get("/admin/stats");

/** Get pending access requests (NGO/Merchant/Govt) */
export const getPendingRequests = () => api.get("/admin/access/pending");

/** Approve an access request */
export const approveRequest = (id, category) =>
  api.post(`/admin/access/${id}/approve`, category ? { category } : {});

/** Reject an access request */
export const rejectRequest = (id, reason) =>
  api.post(`/admin/access/${id}/reject`, { reason });

/** Get all users with optional filters */
export const getUsers = (params = {}) =>
  api.get("/admin/users", { params });

/** Toggle user active/inactive */
export const toggleUserActive = (id) =>
  api.post(`/admin/users/${id}/toggle-active`);

/** Get all merchants */
export const getMerchants = (params = {}) =>
  api.get("/admin/merchants", { params });

/** Update merchant category or status */
export const updateMerchant = (merchantId, data) =>
  api.patch(`/admin/merchants/${merchantId}`, data);

/** Get audit logs with optional filters */
export const getAuditLogs = (params = {}) =>
  api.get("/admin/audit-logs", { params });
