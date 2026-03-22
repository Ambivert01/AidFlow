import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import * as adminController from "./admin.controller.js";

const router = express.Router();

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

export default router;
