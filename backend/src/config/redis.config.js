import IORedis from "ioredis";

// Read directly from process.env instead of the env object from env.config.js.
// This file is imported very early in the module graph (app.js → queue-dashboard
// → queues → here) — before dotenv has finished injecting values into the env
// object. Reading from process.env directly works because Node.js resolves
// process.env lazily at access time, not at import time.
//
// REDIS_URL   → set by Render Key Value (production). Takes priority.
// REDIS_HOST  → used for local dev with a local redis-server.
// REDIS_PORT  → used alongside REDIS_HOST for local dev.

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

export const redisConnection = REDIS_URL
  ? new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // REQUIRED for BullMQ
    })
  : new IORedis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: null, // REQUIRED for BullMQ
    });
