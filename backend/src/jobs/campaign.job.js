import cron from "node-cron";
import { checkAndCompleteCampaigns } from "../modules/campaign/campaign.service.js";
import { logger } from "../utils/logger.js";

/**
 * Campaign Completion Cron Job
 * Runs every hour to check if any active campaigns should be completed
 * based on targetAmount reached or endDate reached
 */
export const startCampaignCompletionJob = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      logger.info("Running campaign completion check...");
      const result = await checkAndCompleteCampaigns();
      logger.info(
        `Campaign completion check complete. Completed ${result.completedCount} campaigns.`,
      );
    } catch (error) {
      logger.error("Campaign completion job failed:", error);
    }
  });

  logger.info("Campaign completion cron job started (runs every hour)");
};
