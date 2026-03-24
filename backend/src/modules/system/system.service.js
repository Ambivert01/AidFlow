import os from "os";

import { SYSTEM_INFO } from "./system.constants.js";

import { redisConnection } from "../../config/redis.config.js";

export const getHealth = async () => {
  return {
    status: "ok",

    uptime: process.uptime(),

    timestamp: new Date(),
  };
};

export const getSystemInfo = async () => {
  return {
    name: SYSTEM_INFO.NAME,

    version: SYSTEM_INFO.VERSION,

    nodeVersion: process.version,

    platform: os.platform(),
  };
};

export const getMetrics = async () => {
  return {
    memoryUsage: process.memoryUsage(),

    cpuLoad: os.loadavg(),

    uptime: process.uptime(),
  };
};

export const redisHealth = async () => {
  const pong = await redisConnection.ping();

  return {
    redis: pong === "PONG" ? "ok" : "down",
  };
};
