import express from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { idempotencyMiddleware } from "../../middlewares/idempotency.middleware.js";
import * as donationController from "./donation.controller.js";
import * as donorController from "./donor.controller.js";
import * as timelineController from "./donation.timeline.controller.js";
import { createDonationSchema } from "./donation.validator.js";
import { donationLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// ── Donor creates donation (with idempotency protection) ─────────────────────────────
router.post(
  "/",
  authenticate,
  authorize("DONOR"),
  donationLimiter,
  idempotencyMiddleware, // Add idempotency middleware
  validate(createDonationSchema),
  donationController.createDonation,
);

// ── Donor dashboard stats ──────────────────────────────
router.get(
  "/dashboard",
  authenticate,
  authorize("DONOR"),
  donorController.getDonorDashboard,
);

// ── Donor sees own donations (populated) ──────────────
router.get(
  "/my",
  authenticate,
  authorize("DONOR"),
  donorController.getDonorDonations,
);

// ── Timeline API Endpoints ─────────────────────────────

// Get donation timeline with filtering and pagination
router.get(
  "/:id/timeline",
  authenticate,
  timelineController.getDonationTimeline,
);

// Export timeline to CSV
router.get(
  "/:id/timeline/export/csv",
  authenticate,
  timelineController.exportTimelineToCSV,
);

// Export timeline to PDF (HTML)
router.get(
  "/:id/timeline/export/pdf",
  authenticate,
  timelineController.exportTimelineToPDF,
);

// Get trust score history for donation's campaign/NGO
router.get(
  "/:id/trust-history",
  authenticate,
  timelineController.getTrustScoreHistory,
);

// Verify blockchain anchor for donation
router.get(
  "/:id/blockchain/verify",
  authenticate,
  timelineController.verifyBlockchainAnchor,
);

// Invalidate timeline cache (admin or donor only)
router.post(
  "/:id/timeline/invalidate-cache",
  authenticate,
  timelineController.invalidateTimelineCache,
);

// Get proof details by ID
router.get(
  "/proofs/:proofId",
  authenticate,
  timelineController.getProofDetails,
);

// Admin-only monitoring endpoints
router.get(
  "/timeline/cache-stats",
  authenticate,
  authorize("ADMIN"),
  timelineController.getCacheStatistics,
);

router.get(
  "/timeline/performance-metrics",
  authenticate,
  authorize("ADMIN"),
  timelineController.getPerformanceMetrics,
);

router.get(
  "/timeline/metrics",
  authenticate,
  authorize("ADMIN"),
  timelineController.getPrometheusMetrics,
);

// ── Get donation by ID ─────────────────────────────────
router.get("/:id", authenticate, donationController.getDonation);

// NOTE: NGO approval and Government decision for donations are handled
// exclusively via /ngo/donations/:id/approve and /government/donations/:id/approve
// (see ngo.routes.js and government.routes.js). The legacy direct routes that
// used to live here were dead code with broken schema writes - removed.

// ── Recurring donations ────────────────────────────────
router.post(
  "/recurring",
  authenticate,
  authorize("DONOR"),
  donationController.createRecurringDonation,
);
router.get(
  "/recurring/list",
  authenticate,
  authorize("DONOR"),
  donationController.getRecurringDonations,
);

export default router;
