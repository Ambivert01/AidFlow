
import { verifyOnChain } from "../services/blockchainAudit.service.js";

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
  

/*
 * Public audit verification (NO AUTH)
 * Anyone can verify an audit hash
 */
export const verifyAuditHash = async (req, res) => {
  const { hash } = req.params;

  if (!hash) {
    return res.status(400).json({
      valid: false,
      message: "Audit hash is required",
    });
  }

  // 1 Check in database
  const record = await AuditLog.findOne({ hash });

  if (!record) {
    return res.status(404).json({
      valid: false,
      message: "Audit record not found",
    });
  }

  // 2 Verify on blockchain (hash-only, no PII)
  let onChainVerified = false;

  try {
    onChainVerified = await verifyOnChain(hash);
  } catch (err) {
    // blockchain may be down — DO NOT FAIL verification
    onChainVerified = false;
  }

  // 3 Verified
  return res.status(200).json({
    valid: true,
    verification: {
      database: true,
      blockchain: onChainVerified,
    },
    proof: {
      eventType: record.eventType,
      jobIdHash: record.jobIdHash,
      actorRole: record.actorRole,
      campaignId: record.campaignId,
      timestamp: record.createdAt,
      previousHash: record.previousHash,
      blockchainTxHash: record.blockchainTxHash || null,
    },
  });

};
