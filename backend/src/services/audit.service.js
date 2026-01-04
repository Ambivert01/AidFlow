import { AuditLog } from "../models/AuditLog.model.js";
import { generateHash } from "../utils/hash.util.js";
import { logAuditOnChain } from "./blockchainAudit.service.js";

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

    // 🔹 Optional blockchain proof
    if (pushToBlockchain) {
      try {
        const txHash = await logAuditOnChain({
          jobIdHash,
          auditHash: hash,
          campaignId: campaignId.toString(),
        });

        log.blockchainTxHash = txHash;
        await log.save();
      } catch (err) {
        // IMPORTANT: audit is still valid even if chain fails
        console.error("Blockchain audit failed:", err.message);
      }
    }

    return log;
  }
}
