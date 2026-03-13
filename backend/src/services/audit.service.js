import { AuditLog } from "../models/AuditLog.model.js";
import { generateHash } from "../utils/hash.util.js";
import { logAuditOnChain } from "./blockchainAudit.service.js";
import { generateMerkleRoot } from "./merkleAudit.service.js";

export class AuditService {

  async log({
    eventType,
    payload,
    jobIdHash,
    campaignId,
    actorRole = "SYSTEM",
  }) {
    // 1. Fetch Tail of the Chain
    const lastLog = await AuditLog.findOne({ jobIdHash }).sort({
      sequence: -1,
    });

    const sequence = lastLog ? lastLog.sequence + 1 : 0;
    const previousHash = lastLog ? lastLog.hash : "GENESIS";

    const auditData = {
      eventType,
      entityId:
        payload?.donationId ||
        payload?.walletId ||
        payload?.beneficiaryId ||
        "SYSTEM",
      payload,
      jobIdHash,
      sequence,
      campaignId,
      actorRole,
      previousHash,
      timestamp: Date.now(),
    };

    const hash = generateHash(auditData);

    return AuditLog.create({
      ...auditData,
      hash,
    });
  }

  /*
   * FINALIZE WORKFLOW AUDIT (ATOMIC & IDEMPOTENT)
   */
  async finalizeWorkflowAudit({ jobIdHash, campaignId }) {
    // 1. Fetch non-finalized logs
    const logs = await AuditLog.find({ jobIdHash, finalizedAt: null }).sort({ sequence: 1 });

    if (!logs.length) {
      // Check if already finalized
      const already = await AuditLog.findOne({ jobIdHash, finalizedAt: { $ne: null } });
      if (already) return { merkleRoot: already.merkleRoot, txHash: already.blockchainTxHash };
      throw new Error("No audit logs found for this job");
    }

    const hashes = logs.map(l => l.hash);
    const merkleRoot = generateMerkleRoot(hashes);

    // 2. ATOMIC UPDATE: Only finalize if not already finalized
    const updateResult = await AuditLog.updateMany(
      { jobIdHash, finalizedAt: null },
      {
        $set: {
          merkleRoot,
          finalizedAt: new Date(),
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Audit log finalization conflict — already processed");
    }

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
