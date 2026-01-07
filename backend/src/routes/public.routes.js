import express from "express";
import { getPublicCampaigns } from "../controllers/public.controller.js";

const router = express.Router();

router.get("/campaigns", getPublicCampaigns);

export default router;
