import express from "express";
import {
  uploadProof,
  getCampaignProofs,
  getDonorProofTimeline,
  verifyProofHash,
  submitManualReview,
} from "./proof.controller.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  proofUploadMiddleware,
  handleMulterError,
} from "../../middlewares/upload.middleware.js";
import {
  uploadProofSchema,
  getCampaignProofsSchema,
  getDonorTimelineSchema,
  verifyProofHashSchema,
  submitManualReviewSchema,
} from "./proof.validator.js";
import { ROLES } from "../../constants/roles.constants.js";

const router = express.Router();

/**
 * @route   POST /api/proof/upload
 * @desc    Upload proof with files
 * @access  NGO
 */
router.post(
  "/upload",
  authenticate,
  authorize([ROLES.NGO]),
  proofUploadMiddleware,
  handleMulterError,
  validate(uploadProofSchema),
  uploadProof,
);

/**
 * @route   GET /api/proof/campaign/:campaignId
 * @desc    Get campaign proofs (verified only)
 * @access  Public
 */
router.get(
  "/campaign/:campaignId",
  validate(getCampaignProofsSchema),
  getCampaignProofs,
);

/**
 * @route   GET /api/proof/donor/:donorId
 * @desc    Get donor proof timeline
 * @access  Authenticated Donor
 */
router.get(
  "/donor/:donorId",
  authenticate,
  validate(getDonorTimelineSchema),
  getDonorProofTimeline,
);

/**
 * @route   GET /api/proof/:proofId/verify
 * @desc    Verify proof hash
 * @access  Public
 */
router.get(
  "/:proofId/verify",
  validate(verifyProofHashSchema),
  verifyProofHash,
);

/**
 * @route   POST /api/proof/:proofId/review
 * @desc    Submit manual review (admin only)
 * @access  Admin
 */
router.post(
  "/:proofId/review",
  authenticate,
  authorize([ROLES.ADMIN]),
  validate(submitManualReviewSchema),
  submitManualReview,
);

export default router;
