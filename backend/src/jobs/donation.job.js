import { donationQueue } from "../queues/donation.queue.js";

export const addDonationJob = async (data) => {
  await donationQueue.add("processDonation", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
};