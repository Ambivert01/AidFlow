import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as merchantController from "./merchant.controller.js";

import { registerMerchantSchema } from "./merchant.validator.js";

const router = express.Router();

// merchant registers

router.post(
  "/",

  authenticate,

  authorize("MERCHANT"),

  validate(registerMerchantSchema),

  merchantController.registerMerchant,
);

// admin approves merchant

router.patch(
  "/:id/approve",

  authenticate,

  authorize("ADMIN", "GOVERNMENT"),

  merchantController.approveMerchant,
);

// admin suspends merchant

router.patch(
  "/:id/suspend",

  authenticate,

  authorize("ADMIN", "GOVERNMENT"),

  merchantController.suspendMerchant,
);

// public list of merchants

router.get(
  "/",

  merchantController.getMerchants,
);

// merchant sees own profile

router.get(
  "/me",

  authenticate,

  authorize("MERCHANT"),

  merchantController.getMyMerchantProfile,
);

export default router;
