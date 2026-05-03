import express from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as beneficiaryController from "./beneficiary.controller.js";
import {
  registerBeneficiarySchema,
  rejectBeneficiarySchema,
  submitAppealSchema,
  reviewAppealSchema,
  bulkUploadSchema,
  adminBlockSchema,
  adminOverrideSchema,
  getBeneficiariesQuerySchema,
  getStatisticsQuerySchema,
} from "./beneficiary.validator.js";

const router = express.Router();

// ============================================
// NGO ROUTES
// ============================================

// Register beneficiary (NGO creates beneficiary for their campaign)
router.post(
  "/",
  authenticate,
  authorize("NGO"),
  validate(registerBeneficiarySchema),
  beneficiaryController.registerBeneficiary,
);

// Get NGO's beneficiaries with filters
router.get(
  "/my",
  authenticate,
  authorize("NGO"),
  validate(getBeneficiariesQuerySchema),
  beneficiaryController.getNGOBeneficiaries,
);

// Get beneficiary details
router.get(
  "/:id",
  authenticate,
  authorize("NGO", "BENEFICIARY", "ADMIN"),
  beneficiaryController.getBeneficiaryDetails,
);

// Approve beneficiary
router.patch(
  "/:id/approve",
  authenticate,
  authorize("NGO"),
  beneficiaryController.approveBeneficiary,
);

// Reject beneficiary
router.patch(
  "/:id/reject",
  authenticate,
  authorize("NGO"),
  validate(rejectBeneficiarySchema),
  beneficiaryController.rejectBeneficiary,
);

// Get campaign beneficiaries
router.get(
  "/campaign/:campaignId",
  authenticate,
  authorize("NGO"),
  beneficiaryController.getCampaignBeneficiaries,
);

// Bulk upload beneficiaries
router.post(
  "/bulk",
  authenticate,
  authorize("NGO"),
  validate(bulkUploadSchema),
  beneficiaryController.bulkUpload,
);

// Get beneficiary statistics
router.get(
  "/statistics",
  authenticate,
  authorize("NGO"),
  validate(getStatisticsQuerySchema),
  beneficiaryController.getBeneficiaryStatistics,
);

// Get pending appeals
router.get(
  "/appeals",
  authenticate,
  authorize("NGO"),
  beneficiaryController.getPendingAppeals,
);

// Review appeal
router.patch(
  "/:id/appeal/review",
  authenticate,
  authorize("NGO"),
  validate(reviewAppealSchema),
  beneficiaryController.reviewAppeal,
);

// ============================================
// BENEFICIARY ROUTES
// ============================================

// Get own profile
router.get(
  "/me",
  authenticate,
  authorize("BENEFICIARY"),
  beneficiaryController.getMyProfile,
);

// Submit appeal
router.post(
  "/:id/appeal",
  authenticate,
  authorize("BENEFICIARY"),
  validate(submitAppealSchema),
  beneficiaryController.submitAppeal,
);

// ============================================
// ADMIN ROUTES
// ============================================

// Get high-risk beneficiaries
router.get(
  "/admin/high-risk",
  authenticate,
  authorize("ADMIN"),
  beneficiaryController.getHighRiskBeneficiaries,
);

// Admin block beneficiary
router.patch(
  "/:id/admin/block",
  authenticate,
  authorize("ADMIN"),
  validate(adminBlockSchema),
  beneficiaryController.adminBlockBeneficiary,
);

// Admin override approval
router.patch(
  "/:id/admin/override",
  authenticate,
  authorize("ADMIN"),
  validate(adminOverrideSchema),
  beneficiaryController.adminOverrideApproval,
);

export default router;
