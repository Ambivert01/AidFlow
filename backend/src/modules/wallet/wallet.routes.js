import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as walletController from "./wallet.controller.js";

import { spendWalletSchema } from "./wallet.validator.js";

const router = express.Router();

// beneficiary spends wallet

router.post(
  "/spend",

  authenticate,

  authorize("BENEFICIARY"),

  validate(spendWalletSchema),

  walletController.spendWallet,
);

// beneficiary views wallet

router.get(
  "/me",

  authenticate,

  authorize("BENEFICIARY"),

  walletController.getMyWallet,
);

// admin freeze wallet

router.patch(
  "/:id/freeze",

  authenticate,

  authorize("ADMIN", "GOVERNMENT"),

  walletController.freezeWallet,
);

export default router;
