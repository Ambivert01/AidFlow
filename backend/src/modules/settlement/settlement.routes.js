import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import * as settlementController from "./settlement.controller.js";

const router = express.Router();

// merchant sees own settlements

router.get(
  "/me",

  authenticate,

  authorize("MERCHANT"),

  settlementController.getMySettlements,
);

// admin processes settlement

router.patch(
  "/:id/process",

  authenticate,

  authorize("ADMIN"),

  settlementController.processSettlement,
);

// admin sees all settlements

router.get(
  "/",

  authenticate,

  authorize("ADMIN"),

  settlementController.getAllSettlements,
);

export default router;
