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
    pushToBlockchain = true,
  }) {
    // 🔹 Get last log in SAME workflow (important!)
    const lastLog = await AuditLog.findOne({ jobIdHash })
      .sort({ createdAt: -1 });

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

    // 🔹 Deterministic hash
    const hash = generateHash(auditData);

    // 🔹 Save locally
    const log = await AuditLog.create({
      ...auditData,
      hash,
    });

    return log;
  }

  /*
   * Finalize a workflow audit:
   * - Build Merkle root
   * - Anchor root on blockchain
   */
  async finalizeWorkflowAudit({ jobIdHash, campaignId }) {
    // 1 Fetch logs in deterministic order
    const logs = await AuditLog.find({ jobIdHash }).sort({ createdAt: 1 });

    if (!logs.length) {
      throw new Error("No audit logs found for workflow");
    }

    // 2 Collect hashes
    const hashes = logs.map(l => l.hash);

    // 3 Build Merkle root
    const merkleRoot = generateMerkleRoot(hashes);

    // 4 Push single proof on-chain
    const txHash = await logAuditOnChain({
      jobIdHash,
      auditHash: merkleRoot,
      campaignId: campaignId.toString(),
    });

    // 5 Persist linkage
    await AuditLog.updateMany(
      { jobIdHash },
      {
        $set: {
          merkleRoot,
          blockchainTxHash: txHash,
        },
      }
    );

    return {
      merkleRoot,
      txHash,
    };
  }
}
