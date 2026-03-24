import cron from "node-cron";
import { RecurringDonation } from "../models/RecurringDonation.model.js";
import { createDonation } from "../modules/donation/donation.service.js";

cron.schedule("0 * * * *", async () => {
  console.log("running recurring donations");

  const due = await RecurringDonation.find({
    nextRun: { $lte: new Date() },

    active: true,
  });

  for (const r of due) {
    await createDonation(r.donor, {
      campaignId: r.campaign,

      amount: r.amount,
    });

    r.nextRun = new Date(Date.now() + r.interval);

    await r.save();
  }
});
