import express from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as ngoController from "./ngo.controller.js";
import { allocateDonationSchema } from "./ngo.validator.js";

const router = express.Router();

// Dashboard stats
router.get("/dashboard", authenticate, authorize("NGO"), ngoController.getDashboard);

// Campaigns
router.get("/campaigns", authenticate, authorize("NGO"), ngoController.getMyCampaigns);

// Donations queue
router.get("/donations/pending", authenticate, authorize("NGO"), ngoController.getPendingDonations);
router.post("/donations/:id/assign", authenticate, authorize("NGO"), ngoController.assignDonation);
router.post("/donations/:id/approve", authenticate, authorize("NGO"), ngoController.approveDonation);
router.post("/donations/:id/reject", authenticate, authorize("NGO"), ngoController.rejectDonation);

// Beneficiaries
router.get("/beneficiaries", authenticate, authorize("NGO"), ngoController.getNgoBeneficiaries);
router.get("/beneficiaries/:campaignId", authenticate, authorize("NGO"), ngoController.getCampaignBeneficiaries);

// Legacy allocate (single step assign+approve)
router.post("/allocate", authenticate, authorize("NGO"), validate(allocateDonationSchema), ngoController.allocateDonation);

export default router;
