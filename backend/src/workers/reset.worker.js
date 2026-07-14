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

      // NOTE: MongoDB's updateMany has no concept of a result limit -
      // chaining .limit() onto it is silently ignored by the driver. Real
      // batching requires fetching a page of IDs and updating just those.
      while (true) {
        const batchIds = await Wallet.find({
          status: WALLET_STATUS.ACTIVE,
          [updateField]: { $gt: 0 },
        })
          .select("_id")
          .limit(batchSize)
          .lean();

        if (batchIds.length === 0) break;

        const result = await Wallet.updateMany(
          { _id: { $in: batchIds.map((w) => w._id) } },
          { $set: { [updateField]: 0 } },
        );

        processedCount += result.modifiedCount;

        // Last page was smaller than a full batch - we're done
        if (batchIds.length < batchSize) break;
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
