import express from "express";
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getSystemStats,
  getAllUsers,
  toggleUserActive,
  getAllMerchants,
  updateMerchantCategory,
  getAuditLogs,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("ADMIN"));

// Access requests
router.get("/access/pending", getPendingRequests);
router.post("/access/:id/approve", approveRequest);
router.post("/access/:id/reject", rejectRequest);

// System stats
router.get("/stats", getSystemStats);

// User management
router.get("/users", getAllUsers);
router.post("/users/:id/toggle-active", toggleUserActive);

// Merchant management
router.get("/merchants", getAllMerchants);
router.patch("/merchants/:merchantId", updateMerchantCategory);

// Audit logs
router.get("/audit-logs", getAuditLogs);

export default router;
