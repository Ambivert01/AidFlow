import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

// Proof validation queue
export const proofValidationQueue = new Queue("proof-validation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Blockchain anchor queue
export const blockchainQueue = new Queue("blockchain-anchor", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
