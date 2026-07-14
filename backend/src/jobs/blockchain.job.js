import { blockchainQueue } from "../queues/blockchain.queue.js";

/**
 * Add blockchain anchoring job
 * @param {Object} data - Job data
 * @param {String} data.type - Entity type (DONATION, PROOF, TRANSACTION)
 * @param {String} data.entityId - Entity ID to anchor
 * @param {Object} data.data - Data to anchor
 */
export const addBlockchainJob = async (data) => {
  await blockchainQueue.add("anchorToBlockchain", data, {
    attempts: 5, // Retry up to 5 times
    backoff: {
      type: "exponential",
      delay: 5000, // Start with 5 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  });

  console.log(
    `[BlockchainJob] Queued blockchain anchoring for ${data.type} ${data.entityId}`,
  );
};
