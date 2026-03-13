import express from "express";
import {
  registerBeneficiary,
  applyToCampaign,
  listBeneficiaries,
  ngoDecision,
  getMyBeneficiary
} from "../controllers/beneficiary.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

/*
NGO ROUTES
*/
router.post(
  "/register",
  authenticate,
  requireRole("NGO"),
  registerBeneficiary
);

router.get(
  "/",
  authenticate,
  requireRole("NGO"),
  listBeneficiaries
);

router.post(
  "/:id/decision",
  authenticate,
  requireRole("NGO"),
  ngoDecision
);

/*
BENEFICIARY ROUTES
*/
router.post(
  "/apply",
  authenticate,
  requireRole("BENEFICIARY"),
  applyToCampaign
);

router.get(
  "/me",
  authenticate,
  requireRole("BENEFICIARY"),
  getMyBeneficiary
);

export default router;
