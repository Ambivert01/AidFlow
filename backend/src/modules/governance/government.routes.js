import express from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import * as govController from "./government.controller.js";

const router = express.Router();

// Overview dashboard stats
router.get("/overview", authenticate, authorize("GOVERNMENT"), govController.getOverview);

// Escalated donations
router.get("/donations/escalated", authenticate, authorize("GOVERNMENT"), govController.getEscalated);
router.post("/donations/:id/approve", authenticate, authorize("GOVERNMENT"), govController.approveDonation);
router.post("/donations/:id/reject", authenticate, authorize("GOVERNMENT"), govController.rejectDonation);
router.patch("/donations/:id/review", authenticate, authorize("GOVERNMENT"), govController.reviewDonation);

// Wallets
router.get("/wallets", authenticate, authorize("GOVERNMENT"), govController.getWallets);
router.post("/wallets/freeze", authenticate, authorize("GOVERNMENT"), govController.freezeWallet);
router.post("/wallets/unfreeze", authenticate, authorize("GOVERNMENT"), govController.unfreezeWallet);

// Campaigns
router.get("/campaigns", authenticate, authorize("GOVERNMENT"), govController.getCampaigns);
router.post("/campaigns/:id/pause", authenticate, authorize("GOVERNMENT"), govController.pauseCampaign);
router.post("/campaigns/:id/close", authenticate, authorize("GOVERNMENT"), govController.closeCampaign);

// Fraud
router.get("/fraud-alerts", authenticate, authorize("GOVERNMENT"), govController.getFraudAlerts);

// Policy
router.patch("/policy", authenticate, authorize("GOVERNMENT"), govController.updatePolicy);

export default router;
