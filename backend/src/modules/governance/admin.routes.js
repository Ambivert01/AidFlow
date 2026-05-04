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
router.get(
  "/fraud-cases/:id",
  authenticate,
  authorize("ADMIN"),
  fraudController.getFraudCase,
);
router.post(
  "/fraud-cases/:id/assign",
  authenticate,
  authorize("ADMIN"),
  fraudController.assignFraudCase,
);
router.post(
  "/fraud-cases/:id/notes",
  authenticate,
  authorize("ADMIN"),
  fraudController.addFraudCaseNote,
);
router.patch(
  "/fraud-cases/:id/resolve",
  authenticate,
  authorize("ADMIN"),
  fraudController.resolveFraudCase,
);
router.get(
  "/fraud-stats",
  authenticate,
  authorize("ADMIN"),
  fraudController.getFraudStats,
);

// ── AI Override ────────────────────────────────────────
router.post(
  "/ai/override",
  authenticate,
  authorize("ADMIN"),
  adminController.overrideAIDecision,
);

// ── Bulk Actions ───────────────────────────────────────
router.post(
  "/users/bulk-approve",
  authenticate,
  authorize("ADMIN"),
  adminController.bulkApproveUsers,
);
router.post(
  "/users/bulk-reject",
  authenticate,
  authorize("ADMIN"),
  adminController.bulkRejectUsers,
);

// ── System Health ──────────────────────────────────────
router.get(
  "/system/health",
  authenticate,
  authorize("ADMIN"),
  adminController.getSystemHealth,
);

// ── Blockchain ─────────────────────────────────────────
router.get(
  "/blockchain/anchors",
  authenticate,
  authorize("ADMIN"),
  adminController.getBlockchainAnchors,
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
