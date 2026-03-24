import { fraudQueue } from "../queues/fraud.queue.js";

export const addFraudCheckJob = async (data) => {
  await fraudQueue.add(
    "fraud-check",

    data,

    {
      attempts: 2,
    },
  );
};
