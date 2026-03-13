import express from "express";
import {
  getNGODashboardStats,
  getPendingDonations,
  assignDonationToBeneficiary,
  approveNGODonation,
  rejectNGODonation,
  listMyBeneficiaries,
  approveBeneficiary,
  rejectBeneficiary,
  getNGODonations,
} from "../controllers/ngo.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("NGO"));

// Dashboard
router.get("/dashboard", getNGODashboardStats);

// Donations
router.get("/donations", getNGODonations);
router.get("/donations/pending", getPendingDonations);
router.post("/donations/:id/assign", assignDonationToBeneficiary);
router.post("/donations/:id/approve", approveNGODonation);
router.post("/donations/:id/reject", rejectNGODonation);

// Beneficiaries
router.get("/beneficiaries", listMyBeneficiaries);
router.post("/beneficiaries/:id/approve", approveBeneficiary);
router.post("/beneficiaries/:id/reject", rejectBeneficiary);

export default router;
