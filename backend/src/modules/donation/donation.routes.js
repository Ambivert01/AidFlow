import express from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as donationController from "./donation.controller.js";
import * as donorController from "./donor.controller.js";
import { createDonationSchema } from "./donation.validator.js";
import { donationLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// ── Donor creates donation ─────────────────────────────
router.post("/", authenticate, authorize("DONOR"), donationLimiter, validate(createDonationSchema), donationController.createDonation);

// ── Donor dashboard stats ──────────────────────────────
router.get("/dashboard", authenticate, authorize("DONOR"), donorController.getDonorDashboard);

// ── Donor sees own donations (populated) ──────────────
router.get("/my", authenticate, authorize("DONOR"), donorController.getDonorDonations);

// ── Get donation by ID ─────────────────────────────────
router.get("/:id", authenticate, donationController.getDonation);

// ── NGO approval (legacy direct route) ────────────────
router.patch("/:id/ngo-approve", authenticate, authorize("NGO"), donationController.approveDonationByNGO);

// ── Government decision ────────────────────────────────
router.patch("/:id/gov-decision", authenticate, authorize("GOVERNMENT"), donationController.governmentDecision);

// ── Recurring donations ────────────────────────────────
router.post("/recurring", authenticate, authorize("DONOR"), donationController.createRecurringDonation);
router.get("/recurring/list", authenticate, authorize("DONOR"), donationController.getRecurringDonations);

export default router;
