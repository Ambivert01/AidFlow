import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as ngoController from "./ngo.controller.js";

import { allocateDonationSchema } from "./ngo.validator.js";

const router = express.Router();

router.post(
  "/allocate",

  authenticate,

  authorize("NGO"),

  validate(allocateDonationSchema),

  ngoController.allocateDonation,
);

router.get(
  "/campaigns",

  authenticate,

  authorize("NGO"),

  ngoController.getMyCampaigns,
);

router.get(
  "/beneficiaries/:campaignId",

  authenticate,

  authorize("NGO"),

  ngoController.getCampaignBeneficiaries,
);

export default router;
