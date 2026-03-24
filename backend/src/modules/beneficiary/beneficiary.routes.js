import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as beneficiaryController from "./beneficiary.controller.js";

import { registerBeneficiarySchema } from "./beneficiary.validator.js";

const router = express.Router();

// self register

router.post(
  "/",

  authenticate,

  authorize("BENEFICIARY"),

  validate(registerBeneficiarySchema),

  beneficiaryController.registerBeneficiary,
);

// NGO approves beneficiary

router.patch(
  "/:id/approve",

  authenticate,

  authorize("NGO"),

  beneficiaryController.approveBeneficiary,
);

// NGO sees campaign beneficiaries

router.get(
  "/campaign/:campaignId",

  authenticate,

  authorize("NGO"),

  beneficiaryController.getCampaignBeneficiaries,
);

// beneficiary sees own profile

router.get(
  "/me",

  authenticate,

  authorize("BENEFICIARY"),

  beneficiaryController.getMyProfile,
);

router.post(
  "/:id/appeal",
  authenticate,
  authorize("BENEFICIARY"),
  beneficiaryController.appealDecision,
);

router.post(
 "/bulk",
 authenticate,
 authorize("NGO"),
 beneficiaryController.bulkUpload
);

export default router;
