import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.config.js";

export const createQueue = (name) => {
  return new Queue(
    name,

    {
      connection: redisConnection,
    },
  );
};
