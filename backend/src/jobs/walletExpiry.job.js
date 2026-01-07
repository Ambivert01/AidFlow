import { Wallet } from "../models/Wallet.model.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();

export async function expireWallets() {
  const expired = await Wallet.find({
    status: "ACTIVE",
    "policy.expiresAt": { $lt: new Date() },
  });

  for (const wallet of expired) {
    wallet.status = "EXPIRED";
    await wallet.save();

    await auditService.log({
      eventType: "WALLET_EXPIRED",
      payload: { walletId: wallet._id },
      jobIdHash: wallet.jobIdHash,
      campaignId: wallet.campaign,
      actorRole: "SYSTEM",
    });
  }
}
