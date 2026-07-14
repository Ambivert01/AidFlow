import cron from "node-cron";
import { walletExpiryQueue } from "../queues/walletExpiry.queue.js";
import { counterResetQueue } from "../queues/counterReset.queue.js";
import { createSettlementsForAllEligibleMerchants } from "../modules/settlement/settlement.service.js";
import { logger } from "../utils/logger.js";

/**
 * Scheduled jobs that were previously missing entirely:
 *
 * - wallet-expiry: a worker (workers/walletExpiry.worker.js) existed and
 *   correctly processed "wallet-expiry" jobs, but nothing ever added a job
 *   to that queue, so wallets never expired no matter how old policy.expiresAt was.
 *
 * - counter-reset: same situation - reset.worker.js existed, queue never fed.
 *   dailySpent/weeklySpent accumulated forever, permanently locking out
 *   beneficiaries once they hit a spending limit.
 *
 * - settlement-batch: createSettlementRecord() existed but nothing ever
 *   called it automatically. Merchants accumulated pendingBalance with no
 *   path to actually getting paid unless an admin manually triggered each one.
 */
export function startScheduledJobs() {
  // Wallet expiry check - hourly
  cron.schedule("0 * * * *", async () => {
    try {
      await walletExpiryQueue.add("check-expired-wallets", {});
      logger.info({ type: "SCHEDULED_JOB_QUEUED", job: "wallet-expiry" });
    } catch (error) {
      logger.error({
        type: "SCHEDULED_JOB_ERROR",
        job: "wallet-expiry",
        error: error.message,
      });
    }
  });

  // Daily spend counter reset - midnight every day
  cron.schedule("0 0 * * *", async () => {
    try {
      await counterResetQueue.add("reset-daily", { type: "daily" });
      logger.info({ type: "SCHEDULED_JOB_QUEUED", job: "counter-reset-daily" });
    } catch (error) {
      logger.error({
        type: "SCHEDULED_JOB_ERROR",
        job: "counter-reset-daily",
        error: error.message,
      });
    }
  });

  // Weekly spend counter reset - midnight every Sunday
  cron.schedule("0 0 * * 0", async () => {
    try {
      await counterResetQueue.add("reset-weekly", { type: "weekly" });
      logger.info({
        type: "SCHEDULED_JOB_QUEUED",
        job: "counter-reset-weekly",
      });
    } catch (error) {
      logger.error({
        type: "SCHEDULED_JOB_ERROR",
        job: "counter-reset-weekly",
        error: error.message,
      });
    }
  });

  // Merchant settlement batch - weekly, Monday 2 AM
  cron.schedule("0 2 * * 1", async () => {
    try {
      const created = await createSettlementsForAllEligibleMerchants();
      logger.info({
        type: "SCHEDULED_JOB_COMPLETED",
        job: "settlement-batch",
        settlementsCreated: created.length,
      });
    } catch (error) {
      logger.error({
        type: "SCHEDULED_JOB_ERROR",
        job: "settlement-batch",
        error: error.message,
      });
    }
  });

  logger.info({
    type: "SCHEDULER_STARTED",
    jobs: [
      "wallet-expiry (hourly)",
      "counter-reset-daily (midnight)",
      "counter-reset-weekly (Sunday midnight)",
      "settlement-batch (Monday 2AM)",
    ],
  });
}
