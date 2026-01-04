import express from "express";
import {
  createCampaign,
  activateCampaign,
  getActiveCampaigns,
} from "../controllers/campaign.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/*
 * NGO creates campaign
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("NGO"),
  createCampaign
);

/*
 * NGO activates campaign
 */
router.patch(
  "/:id/activate",
  authenticate,
  authorizeRoles("NGO"),
  activateCampaign
);

/*
 * Public: list active campaigns
 */
router.get("/", getActiveCampaigns);

export default router;
