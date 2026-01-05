import express from "express";
import { getAuditLogs, verifyAudit } from "../controllers/audit.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/*
 * ADMIN: Internal audit logs
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  getAuditLogs
);

/*
 * PUBLIC: Audit verification (no auth)
 */
router.get("/verify/:jobIdHash", verifyAudit);

export default router;
