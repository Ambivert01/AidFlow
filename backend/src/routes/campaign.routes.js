import express from "express";
import {
  createCampaign,
  activateCampaign,
  getActiveCampaigns,
  getNgoCampaigns,
  getCampaignDetail,
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
router.post(
  "/:id/activate",
  authenticate,
  authorizeRoles("NGO"),
  activateCampaign
);

/*
 * NGO: get own campaigns  
 */
router.get(
  "/ngo",
  authenticate,
  authorizeRoles("NGO"),
  getNgoCampaigns
);

/*
 * Detailed campaign view
 */
router.get(
  "/:id",
  authenticate,
  getCampaignDetail
);

/*
 * Public: list active campaigns
 */
router.get("/", getActiveCampaigns);

export default router;
