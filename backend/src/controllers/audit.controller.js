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

    // 1 Fetch full audit chain
    const logs = await AuditLog.find({ jobIdHash }).sort({ createdAt: 1 });

    if (!logs.length) {
      return res.status(404).json({
        valid: false,
        message: "No audit logs found for this ID",
      });
    }

    // 2 Find finalized audit (must have merkleRoot)
    const finalizedLog = logs.find(l => l.merkleRoot);

    if (!finalizedLog) {
      return res.status(400).json({
        valid: false,
        message: "Audit not finalized yet",
      });
    }

    const localMerkleRoot = finalizedLog.merkleRoot;

    // 3 Verify ON-CHAIN using jobIdHash (SOURCE OF TRUTH)
    const chainResult = await verifyOnChain(jobIdHash);

    if (!chainResult) {
      return res.json({
        valid: false,
        jobIdHash,
        reason: "No on-chain audit record found",
      });
    }

    // 4 Compare on-chain hash vs local Merkle root
    const isValid = chainResult.auditHash === localMerkleRoot;

    // 5 FINAL PUBLIC RESPONSE
    return res.json({
      valid: isValid,
      jobIdHash,
      merkleRoot: localMerkleRoot,
      blockchain: {
        anchored: true,
        campaignId: chainResult.campaignId,
        timestamp: chainResult.timestamp,
      },
      blockchainTxHash: finalizedLog.blockchainTxHash || null,
      events: logs.map(log => ({
        eventType: log.eventType,
        actorRole: log.actorRole,
        timestamp: log.createdAt,
      })),
    });

  } catch (err) {
    return res.status(500).json({
      valid: false,
      message: err.message,
    });
  }
};

