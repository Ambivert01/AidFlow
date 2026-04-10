import cron from "node-cron";
import { RecurringDonation } from "../models/RecurringDonation.model.js";
import { createDonation } from "../modules/donation/donation.service.js";
import { logger } from "../utils/logger.js";

const INTERVAL_MS = {
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

// Runs every hour
cron.schedule("0 * * * *", async () => {
  logger.info("Running recurring donations check");

  const due = await RecurringDonation.find({
    nextRun: { $lte: new Date() },
    status: "ACTIVE",
  });

  for (const r of due) {
    try {
      await createDonation(r.donor, {
        campaignId: r.campaign,
        amount: r.amount,
      });

      const intervalMs = INTERVAL_MS[r.interval] || INTERVAL_MS.MONTHLY;
      r.nextRun = new Date(Date.now() + intervalMs);
      await r.save();
    } catch (err) {
      logger.error({ type: "RECURRING_DONATION_FAILED", id: r._id, error: err.message });
    }
  }
});
