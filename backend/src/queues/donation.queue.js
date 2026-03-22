import { Queue } from "bullmq";
import { connection } from "./connection.js";

export const donationQueue = new Queue("donationQueue", {
  connection,
});