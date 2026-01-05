import express from "express";
import {
  getPendingDonations,
  approveDonation,
  rejectDonation,
} from "../controllers/ngo.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// NGO only routes
router.use(authenticate, authorizeRoles("NGO"));

router.get("/donations/pending", getPendingDonations);
router.post("/donations/:id/approve", approveDonation);
router.post("/donations/:id/reject", rejectDonation);

export default router;
