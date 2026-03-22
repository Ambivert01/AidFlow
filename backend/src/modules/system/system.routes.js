import express from "express";

import * as systemController from "./system.controller.js";

const router = express.Router();

// health check

router.get(
  "/health",

  systemController.healthCheck,
);

// system info

router.get(
  "/info",

  systemController.systemInfo,
);

// metrics

router.get(
  "/metrics",

  systemController.metrics,
);

export default router;
