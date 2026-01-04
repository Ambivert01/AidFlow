import express from "express";
import { getBeneficiaryDashboard } from "../controllers/beneficiary.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/*
 * Beneficiary dashboard
 */
router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("BENEFICIARY"),
  getBeneficiaryDashboard
);

export default router;
