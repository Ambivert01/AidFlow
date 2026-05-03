import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { Wallet } from "../models/wallet/Wallet.model.js";
import { WALLET_STATUS } from "../modules/wallet/wallet.constants.js";

new Worker(
  "counter-reset",
  async (job) => {
    const { type } = job.data; // 'daily' or 'weekly'
    const batchSize = 500;
    let processedCount = 0;

    try {
      const updateField = type === "daily" ? "dailySpent" : "weeklySpent";

      console.log(`Starting ${type} counter reset`);

      // Reset counters in batches
      while (true) {
        const result = await Wallet.updateMany(
          {
            status: WALLET_STATUS.ACTIVE,
            [updateField]: { $gt: 0 },
          },
          { $set: { [updateField]: 0 } },
        ).limit(batchSize);

        processedCount += result.modifiedCount;

        // Break if no more wallets to process
        if (result.modifiedCount < batchSize) {
          break;
        }
      }

      console.log(
        `${type} reset completed: ${processedCount} wallets processed`,
      );
      return { processedCount };
    } catch (error) {
      console.error(`${type} reset failed:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Single worker to prevent duplicate processing
  },
);

console.log("Counter reset worker started");
