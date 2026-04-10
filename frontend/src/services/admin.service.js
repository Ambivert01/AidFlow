import api from "./api";

export const getStats = () => api.get("/admin/stats");
export const getPendingRequests = () => api.get("/admin/access/pending");
export const approveRequest = (id, payload = {}) => api.post(`/admin/access/${id}/approve`, payload);
export const rejectRequest = (id, reason) => api.post(`/admin/access/${id}/reject`, { reason });
export const getUsers = (params = {}) => api.get("/admin/users", { params });
export const toggleUserActive = (id) => api.post(`/admin/users/${id}/toggle-active`);
export const getMerchants = (params = {}) => api.get("/admin/merchants", { params });
export const updateMerchant = (merchantId, data) => api.patch(`/admin/merchants/${merchantId}`, data);
export const getAuditLogs = (params = {}) => api.get("/admin/audit-logs", { params });
