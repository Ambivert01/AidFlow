import express from "express";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as merchantController from "./merchant.controller.js";
import { registerMerchantSchema } from "./merchant.validator.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { getMerchantTransactions } from "./payment.service.js";

const router = express.Router();

// Merchant registers (creates user + pending merchant profile)
router.post("/", authenticate, authorize("MERCHANT"), validate(registerMerchantSchema), merchantController.registerMerchant);

// Admin approves merchant
router.patch("/:id/approve", authenticate, authorize("ADMIN", "GOVERNMENT"), merchantController.approveMerchant);

// Admin suspends merchant
router.patch("/:id/suspend", authenticate, authorize("ADMIN", "GOVERNMENT"), merchantController.suspendMerchant);

// Public list of active merchants
router.get("/", merchantController.getMerchants);

// Merchant sees own profile
router.get("/me", authenticate, authorize("MERCHANT"), merchantController.getMyMerchantProfile);

// Merchant sees own transactions
router.get("/transactions", authenticate, authorize("MERCHANT"), asyncHandler(async (req, res) => {
  const result = await getMerchantTransactions(req.user._id);
  res.json(result);
}));

export default router;
