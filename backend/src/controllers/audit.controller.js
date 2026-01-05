import { AuditLog } from "../models/AuditLog.model.js";
import { verifyOnChain } from "../services/blockchainAudit.service.js";

/*
 * ADMIN: Get recent audit logs
 */
export const getAuditLogs = async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(logs);
};

/*
 * PUBLIC: Verify full AidFlow audit (Merkle-based)
 * Input: jobIdHash (donationId)
 */
export const verifyAudit = async (req, res) => {
  try {
    const { jobIdHash } = req.params;

    // 1 Fetch full audit chain for workflow
    const logs = await AuditLog.find({ jobIdHash }).sort({ createdAt: 1 });

    if (!logs.length) {
      return res.status(404).json({
        valid: false,
        message: "No audit logs found for this ID",
      });
    }

    const merkleRoot = logs[0].merkleRoot;

    if (!merkleRoot) {
      return res.status(400).json({
        valid: false,
        message: "Audit not finalized yet",
      });
    }

    // 2 Verify Merkle root on blockchain
    const blockchainVerified = await verifyOnChain(merkleRoot);

    // 3 Response
    return res.json({
      valid: blockchainVerified,
      jobIdHash,
      merkleRoot,
      blockchainTxHash: logs[0].blockchainTxHash || null,
      events: logs.map((log) => ({
        eventType: log.eventType,
        actorRole: log.actorRole,
        timestamp: log.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({
      valid: false,
      message: err.message,
    });
  }
};
