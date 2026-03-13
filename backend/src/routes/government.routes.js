import express from "express";
import {
  getOverview,
  getEscalatedDonations,
  approveDonation,
  rejectDonation,
  freezeWallet,
  unfreezeWallet,
  getWalletsList,
  getFraudAlerts,
  getActiveCampaignsForGovt,
  pauseCampaign,
  closeCampaign,
} from "../controllers/government.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("GOVERNMENT"));

router.get("/overview", getOverview);

// Escalated donations
router.get("/donations/escalated", getEscalatedDonations);
router.post("/donations/:id/approve", approveDonation);
router.post("/donations/:id/reject", rejectDonation);

// Wallet control
router.get("/wallets", getWalletsList);
router.post("/wallets/freeze", freezeWallet);
router.post("/wallets/unfreeze", unfreezeWallet);

// Fraud monitor
router.get("/fraud-alerts", getFraudAlerts);

// Campaign oversight
router.get("/campaigns", getActiveCampaignsForGovt);
router.post("/campaigns/:id/pause", pauseCampaign);
router.post("/campaigns/:id/close", closeCampaign);

export default router;
