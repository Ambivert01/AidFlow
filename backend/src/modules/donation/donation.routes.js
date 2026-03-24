import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as donationController from "./donation.controller.js";

import { createDonationSchema } from "./donation.validator.js";

import { donationLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// donor creates donation

router.post(
  "/",

  authenticate,

  authorize("DONOR"),

  donationLimiter,

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

router.post(
  "/recurring",
  authenticate,
  authorize("DONOR"),
  donationController.createRecurringDonation,
);

router.get(
  "/recurring",
  authenticate,
  authorize("DONOR"),
  donationController.getRecurringDonations,
);

export default router;
