// src/infrastructure/queue-dashboard.js

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { aiQueue } from "../queues/ai.queue.js";
import { donationQueue } from "../queues/donation.queue.js";
import { fraudQueue } from "../queues/fraud.queue.js";

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullMQAdapter(aiQueue),

    new BullMQAdapter(donationQueue),

    new BullMQAdapter(fraudQueue),
  ],

  serverAdapter,
});

serverAdapter.setBasePath("/admin/queues");

export default serverAdapter;
