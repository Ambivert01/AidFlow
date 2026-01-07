import { AuditLog } from "../models/AuditLog.model.js";
import { generateHash } from "../utils/hash.util.js";
import { logAuditOnChain } from "./blockchainAudit.service.js";
import { generateMerkleRoot } from "./merkleAudit.service.js";

export class AuditService {

  /*
   * Log an AidFlow audit event immutably
   */
  async log({
    eventType,
    payload,
    jobIdHash,
    campaignId,
    actorRole = "SYSTEM",
  }) {
    const lastLog = await AuditLog.findOne({ jobIdHash }).sort({
      createdAt: -1,
    });

    const auditData = {
      eventType,
      entityId:
        payload?.donationId ||
        payload?.walletId ||
        payload?.beneficiaryId ||
        "SYSTEM",
      payload,
      jobIdHash,
      campaignId,
      actorRole,
      previousHash: lastLog ? lastLog.hash : null,
      timestamp: Date.now(),
    };

    const hash = generateHash(auditData);

    return AuditLog.create({
      ...auditData,
      hash,
    });
  }

  /*
   * FINALIZE WORKFLOW AUDIT (ONLY ONCE)
   */
  async finalizeWorkflowAudit({ jobIdHash, campaignId }) {

    const logs = await AuditLog.find({ jobIdHash }).sort({ createdAt: 1 });

    if (!logs.length) {
      throw new Error("No audit logs found");
    }

    // CRITICAL: Prevent re-finalization
    if (logs.some(l => l.finalizedAt)) {
      throw new Error("Audit already finalized");
    }

    const hashes = logs.map(l => l.hash);
    const merkleRoot = generateMerkleRoot(hashes);

    // Save Merkle root locally
    await AuditLog.updateMany(
      { jobIdHash },
      {
        $set: {
          merkleRoot,
          finalizedAt: new Date(),
        },
      }
    );

    // Anchor on blockchain (optional)
    let txHash = null;
    try {
      txHash = await logAuditOnChain({
        jobIdHash,
        auditHash: merkleRoot,
        campaignId: campaignId.toString(),
      });
    } catch {
      console.warn("⚠ Blockchain anchoring skipped");
    }

    if (txHash) {
      await AuditLog.updateMany(
        { jobIdHash },
        { $set: { blockchainTxHash: txHash } }
      );
    }

    return { merkleRoot, txHash };
  }
}
