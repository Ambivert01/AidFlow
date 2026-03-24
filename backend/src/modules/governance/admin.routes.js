import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import * as adminController from "./admin.controller.js";

import * as fraudController from "./fraud.controller.js";

import * as govController from "../governance/governance.controller.js";

const router = express.Router();

router.get(
  "/fraud-cases",

  authenticate,

  authorize("ADMIN"),

  fraudController.getFraudCases,
);

router.patch(
  "/fraud-cases/:id/resolve",

  authenticate,

  authorize("ADMIN"),

  fraudController.resolveFraudCase,
);

router.patch(
  "/users/:id/approve",

  authenticate,

  authorize("ADMIN"),

  adminController.approveUser,
);

router.patch(
  "/wallets/:id/freeze",

  authenticate,

  authorize("ADMIN"),

  adminController.freezeWallet,
);

router.patch(
  "/merchants/:id/ban",

  authenticate,

  authorize("ADMIN"),

  adminController.banMerchant,
);

router.get(
  "/fraud-alerts",

  authenticate,

  authorize("ADMIN"),

  adminController.getFraudAlerts,
);

router.patch(
  "/policy",
  authenticate,
  authorize("GOVERNMENT"),
  govController.updatePolicy,
);

export default router;
