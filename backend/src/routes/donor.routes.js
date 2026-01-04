import express from "express";
import { getMyDonations } from "../controllers/donor.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/*
 * Donor donation history
 */
router.get(
  "/donations",
  authenticate,
  authorizeRoles("DONOR"),
  getMyDonations
);

export default router;
