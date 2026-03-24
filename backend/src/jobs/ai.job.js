import { aiQueue } from "../queues/ai.queue.js";

export const addAIDecisionJob = async (data) => {
  await aiQueue.add(
    "ai-task",

    data,

    {
      attempts: 3,

      backoff: {
        type: "exponential",

        delay: 2000,
      },
    },
  );
};
