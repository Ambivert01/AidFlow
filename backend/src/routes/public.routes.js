import express from "express";
import {
  getPublicStats,
  getPublicCampaigns,
  getPublicCampaignDetail,
  getPublicAudit,
  getCampaignAuditSummary,
  verifyAuditHash,
} from "../controllers/public.controller.js";

const router = express.Router();

// No authentication needed for public routes
router.get("/stats", getPublicStats);
router.get("/campaigns", getPublicCampaigns);
router.get("/campaigns/:id", getPublicCampaignDetail);
router.get("/audit/:jobIdHash", getPublicAudit);
router.get("/campaign-audit/:campaignId", getCampaignAuditSummary);
router.get("/verify/:jobIdHash", verifyAuditHash);

export default router;
