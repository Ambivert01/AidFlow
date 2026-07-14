import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { processSettlement } from "../modules/settlement/settlement.service.js";
import { logger } from "../utils/logger.js";

/**
 * Settlement processing worker.
 *
 * Previously, settlement.service.createSettlementRecord() added jobs to the
 * "settlement-processing" queue, but no worker ever consumed them - jobs
 * accumulated in Redis forever and merchants were never actually paid out.
 * This worker closes that gap.
 */
new Worker(
  "settlement-processing",
  async (job) => {
    const { settlementId } = job.data;

    logger.info({
      type: "SETTLEMENT_PROCESSING_STARTED",
      settlementId,
      jobId: job.id,
    });

    try {
      const result = await processSettlement(settlementId);

      logger.info({
        type: "SETTLEMENT_PROCESSING_COMPLETED",
        settlementId,
        jobId: job.id,
      });

      return result;
    } catch (error) {
      logger.error({
        type: "SETTLEMENT_PROCESSING_ERROR",
        settlementId,
        jobId: job.id,
        error: error.message,
        stack: error.stack,
      });

      // Re-throw to trigger BullMQ retry/backoff
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);

logger.info({ type: "WORKER_STARTED", worker: "settlement-processing" });
