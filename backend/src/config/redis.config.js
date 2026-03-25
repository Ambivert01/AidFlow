import IORedis from "ioredis";
import { env } from "./env.config.js";

export const redisConnection = new IORedis({

  host: env.REDIS_HOST,

  port: env.REDIS_PORT,

  maxRetriesPerRequest: null,   // REQUIRED for BullMQ

});