import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { Wallet } from "../models/wallet/Wallet.model.js";
import { Beneficiary } from "../models/beneficiary/Beneficiary.model.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import { createNotification } from "../modules/notification/notification.service.js";
import {
  WALLET_STATUS,
  AUDIT_EVENT_TYPES,
} from "../modules/wallet/wallet.constants.js";

new Worker(
  "wallet-expiry",
  async (job) => {
    const batchSize = 100;
    let processedCount = 0;
    let errorCount = 0;

    try {
      const now = new Date();

      // Find expired wallets in batches
      const expiredWallets = await Wallet.find({
        "policy.expiresAt": { $lt: now },
        status: WALLET_STATUS.ACTIVE,
      }).limit(batchSize);

      console.log(`Processing ${expiredWallets.length} expired wallets`);

      for (const wallet of expiredWallets) {
        try {
          // Update wallet status
          wallet.status = WALLET_STATUS.EXPIRED;
          wallet.expiredAt = now;
          await wallet.save();

          // Create audit log
          await createAuditLog({
            eventType: AUDIT_EVENT_TYPES.WALLET_EXPIRED,
            eventCategory: "WALLET",
            entityType: "Wallet",
            entityId: wallet._id.toString(),
            jobIdHash: wallet.jobIdHash || wallet._id.toString(),
            actorRole: "SYSTEM",
            payload: {
              expiredAt: now,
              remainingBalance: wallet.balance,
            },
          });

          // Send notification to beneficiary
          try {
            const beneficiary = await Beneficiary.findById(wallet.beneficiary);
            if (beneficiary) {
              await createNotification({
                userId: beneficiary.user,
                role: "BENEFICIARY",
                type: "WALLET_EXPIRED",
                title: "Wallet Expired",
                message: `Your wallet has expired. Remaining balance: ₹${wallet.balance}`,
                entityType: "Wallet",
                entityId: wallet._id.toString(),
                priority: "HIGH",
              });
            }
          } catch (error) {
            console.error(
              `Failed to send expiry notification for wallet ${wallet._id}:`,
              error,
            );
          }

          processedCount++;
        } catch (error) {
          console.error(`Failed to expire wallet ${wallet._id}:`, error);
          errorCount++;
          // Continue processing other wallets
        }
      }

      console.log(
        `Expiry job completed: ${processedCount} processed, ${errorCount} errors`,
      );
      return { processedCount, errorCount };
    } catch (error) {
      console.error("Expiry job failed:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Single worker to prevent duplicate processing
  },
);

console.log("Wallet expiry worker started");
