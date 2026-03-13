import express from "express";
import {
  getDonorDashboard,
  getMyDonations,
  getDonationDetail,
  searchCampaigns,
} from "../controllers/donor.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("DONOR"));

router.get("/dashboard", getDonorDashboard);
router.get("/donations", getMyDonations);
router.get("/donations/:donationId", getDonationDetail);
router.get("/campaigns/search", searchCampaigns);

export default router;
