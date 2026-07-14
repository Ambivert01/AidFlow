import { connectWorkerDB } from "./bootstrap.js";

await connectWorkerDB();

import "./donation.worker.js";
import "./walletExpiry.worker.js";
import "./ai.worker.js";
import "./fraud.worker.js";
import "./recurring.worker.js";
import "./proof.worker.js";
import "./settlement.worker.js";
import "./reset.worker.js";

import { startScheduledJobs } from "./scheduler.js";
startScheduledJobs();

console.log("All workers started");
