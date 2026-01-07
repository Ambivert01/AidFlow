import express from "express";
import {
  getAuditLogs,
  verifyAudit,
  getAuditTimeline,
} from "../controllers/audit.controller.js";
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

/*
 * AUTHENTICATED: Full audit timeline
 * Used by Donor, NGO, Government
 */
router.get(
  "/timeline/:jobIdHash",
  authenticate,
  getAuditTimeline
);


export default router;
