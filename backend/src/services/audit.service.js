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

    return await AuditLog.create({
      ...auditData,
      hash,
    });
  }

  /*
   * FINALIZE WORKFLOW AUDIT
   */
  async finalizeWorkflowAudit({ jobIdHash, campaignId }) {
    const logs = await AuditLog.find({ jobIdHash }).sort({ createdAt: 1 });

    if (!logs.length) {
      throw new Error("No audit logs found");
    }

    const hashes = logs.map((l) => l.hash);
    const merkleRoot = generateMerkleRoot(hashes);

    // ALWAYS SAVE MERKLE ROOT
    await AuditLog.updateMany(
      { jobIdHash },
      {
        $set: {
          merkleRoot,
          finalizedAt: new Date(),
        },
      }
    );

    // OPTIONAL BLOCKCHAIN
    let txHash = null;
    try {
      txHash = await logAuditOnChain({
        jobIdHash,
        auditHash: merkleRoot,
        campaignId: campaignId.toString(),
      });
    } catch (e) {
      console.warn("Blockchain skipped");
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
