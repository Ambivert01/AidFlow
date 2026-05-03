import express from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import * as adminController from "./admin.controller.js";
import * as fraudController from "./fraud.controller.js";

const router = express.Router();

// ── Stats ──────────────────────────────────────────────
router.get(
  "/stats",
  authenticate,
  authorize("ADMIN"),
  adminController.getStats,
);

// ── Pending KYC requests ───────────────────────────────
router.get(
  "/access/pending",
  authenticate,
  authorize("ADMIN"),
  adminController.getPendingRequests,
);
router.post(
  "/access/:id/approve",
  authenticate,
  authorize("ADMIN"),
  adminController.approveUser,
);
router.post(
  "/access/:id/reject",
  authenticate,
  authorize("ADMIN"),
  adminController.rejectUser,
);

// ── User management ────────────────────────────────────
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  adminController.getAllUsers,
);
router.post(
  "/users/:id/toggle-active",
  authenticate,
  authorize("ADMIN"),
  adminController.toggleUserActive,
);

// ── Merchant management ────────────────────────────────
router.get(
  "/merchants",
  authenticate,
  authorize("ADMIN"),
  adminController.getAllMerchants,
);
router.patch(
  "/merchants/:id",
  authenticate,
  authorize("ADMIN"),
  adminController.updateMerchant,
);
router.patch(
  "/merchants/:id/ban",
  authenticate,
  authorize("ADMIN"),
  adminController.banMerchant,
);

// ── Wallet management ──────────────────────────────────
router.patch(
  "/wallets/:id/freeze",
  authenticate,
  authorize("ADMIN"),
  adminController.freezeWallet,
);

// ── Audit logs ─────────────────────────────────────────
router.get(
  "/audit-logs",
  authenticate,
  authorize("ADMIN"),
  adminController.getAuditLogs,
);

// ── Fraud ──────────────────────────────────────────────
router.get(
  "/fraud-alerts",
  authenticate,
  authorize("ADMIN"),
  adminController.getFraudAlerts,
);
router.get(
  "/fraud-cases",
  authenticate,
  authorize("ADMIN"),
  fraudController.getFraudCases,
);
router.patch(
  "/fraud-cases/:id/resolve",
  authenticate,
  authorize("ADMIN"),
  fraudController.resolveFraudCase,
);

// ── Campaign Approval ──────────────────────────────────
router.get(
  "/campaigns/pending",
  authenticate,
  authorize("ADMIN"),
  adminController.getPendingCampaigns,
);
router.post(
  "/campaigns/:id/approve",
  authenticate,
  authorize("ADMIN"),
  adminController.approveCampaign,
);
router.post(
  "/campaigns/:id/reject",
  authenticate,
  authorize("ADMIN"),
  adminController.rejectCampaign,
);
router.post(
  "/campaigns/:id/pause",
  authenticate,
  authorize("ADMIN"),
  adminController.pauseCampaign,
);
router.post(
  "/campaigns/:id/resume",
  authenticate,
  authorize("ADMIN"),
  adminController.resumeCampaign,
);

export default router;
