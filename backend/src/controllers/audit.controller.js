import { AuditLog } from "../models/AuditLog.model.js";

/*
 * Get audit logs (ADMIN only)
 */
export const getAuditLogs = async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(logs);
};
