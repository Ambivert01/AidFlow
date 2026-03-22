import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { redisConnection } from "../config/redis.config.js";

export const connection = redisConnection;