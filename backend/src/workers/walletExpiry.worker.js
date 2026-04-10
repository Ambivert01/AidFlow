import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

import { Wallet } from "../models/wallet/Wallet.model.js";
import { createAuditLog } from "../modules/audit/audit.service.js";

new Worker(
  "wallet-expiry",

  async () => {
    const wallets = await Wallet.find({
      status: "ACTIVE",

      "policy.expiresAt": { $lt: new Date() },
    });

    for (const wallet of wallets) {
      wallet.status = "EXPIRED";

      await wallet.save();

      await createAuditLog({
        eventType: "WALLET_EXPIRED",

        eventCategory: "WALLET",

        entityType: "Wallet",

        entityId: wallet._id.toString(),

        jobIdHash: wallet.jobIdHash || wallet._id.toString(),

        actorRole: "SYSTEM",

        payload: {
          expiredAt: new Date(),
        },
      });
    }
  },

  {
    connection: redisConnection,
  },
);
