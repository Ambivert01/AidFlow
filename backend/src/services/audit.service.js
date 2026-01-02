import { AuditLog } from "../models/AuditLog.model.js";
import { generateHash } from "../utils/hash.util.js";

export class AuditService {
  /*
   * Log an event immutably
   */
  async log(eventType, payload) {
    const lastLog = await AuditLog.findOne().sort({ createdAt: -1 });

    const auditData = {
      eventType,
      entityId: payload.donationId || payload.walletId || "SYSTEM",
      payload,
      previousHash: lastLog ? lastLog.hash : null,
      timestamp: Date.now(),
    };

    const hash = generateHash(auditData);

    const log = await AuditLog.create({
      ...auditData,
      hash,
    });

    return log;
  }
}
