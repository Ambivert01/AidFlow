import { asyncHandler } from "../../core/asyncHandler.js";

import * as systemService from "./system.service.js";

export const healthCheck = asyncHandler(async (req, res) => {
  const result = await systemService.getHealth();

  res.json(result);
});

export const systemInfo = asyncHandler(async (req, res) => {
  const result = await systemService.getSystemInfo();

  res.json(result);
});

export const metrics = asyncHandler(async (req, res) => {
  const result = await systemService.getMetrics();

  res.json(result);
});
