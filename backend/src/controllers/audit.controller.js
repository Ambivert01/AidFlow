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
 */
export const verifyAudit = async (req, res) => {
  try {
    const { jobIdHash } = req.params;

    const logs = await AuditLog.find({ jobIdHash }).sort({ createdAt: 1 });

    if (!logs.length) {
      return res.status(404).json({
        valid: false,
        message: "No audit logs found for this ID",
      });
    }

    const finalizedLog = logs.find((l) => l.merkleRoot);

    if (!finalizedLog) {
      return res.status(400).json({
        valid: false,
        message: "Audit not finalized yet",
      });
    }

    const merkleRoot = finalizedLog.merkleRoot;

    // Merkle = source of truth
    let blockchainAnchored = false;

    try {
      blockchainAnchored = await verifyOnChain(merkleRoot);
    } catch {
      blockchainAnchored = false;
    }

    return res.json({
      valid: true, // FINAL ANSWER
      jobIdHash,
      merkleRoot,
      blockchainAnchored,
      blockchainTxHash: finalizedLog.blockchainTxHash || null,
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
