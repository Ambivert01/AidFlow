import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as donationController from "./donation.controller.js";

import { createDonationSchema } from "./donation.validator.js";

const router = express.Router();

// donor creates donation

router.post(
  "/",

  authenticate,

  authorize("DONOR"),

  validate(createDonationSchema),

  donationController.createDonation,
);

// donor sees own donations

router.get(
  "/my",

  authenticate,

  authorize("DONOR"),

  donationController.getMyDonations,
);

// get donation details

router.get(
  "/:id",

  authenticate,

  donationController.getDonation,
);

// NGO approval

router.patch(
  "/:id/ngo-approve",

  authenticate,

  authorize("NGO"),

  donationController.approveDonationByNGO,
);

// government decision

router.patch(
  "/:id/gov-decision",

  authenticate,

  authorize("GOVERNMENT"),

  donationController.governmentDecision,
);

export default router;
