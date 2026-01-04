import express from "express";
import { getAuditLogs, verifyAuditHash } from "../controllers/audit.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();
/**
 * Internal audit logs (ADMIN only)
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getAuditLogs
);

/**
 * Public audit verification
 */
router.get(
  "/verify/:hash",
  verifyAuditHash
)

export default router;
