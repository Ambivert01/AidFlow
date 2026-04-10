import express from "express";
import { asyncHandler } from "../../core/asyncHandler.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as walletController from "./wallet.controller.js";
import { spendWalletSchema } from "./wallet.validator.js";
import { walletLimiter } from "../../middlewares/rateLimit.middleware.js";
import { generateQRToken } from "../merchant/payment.service.js";

const router = express.Router();

// Beneficiary spends wallet at merchant
router.post("/spend", authenticate, authorize("BENEFICIARY"), walletLimiter, validate(spendWalletSchema), walletController.spendWallet);

// Beneficiary views own wallet
router.get("/me", authenticate, authorize("BENEFICIARY"), walletController.getMyWallet);

// Beneficiary views own transaction history
router.get("/transactions", authenticate, authorize("BENEFICIARY"), walletController.getMyTransactions);

// Beneficiary generates QR token
router.post("/qr", authenticate, authorize("BENEFICIARY"), asyncHandler(async (req, res) => {
  const result = await generateQRToken(req.user._id, req.body.walletId);
  res.json(result);
}));

// Admin / Government freeze wallet
router.patch("/:id/freeze", authenticate, authorize("ADMIN", "GOVERNMENT"), walletController.freezeWallet);

// Admin / Government unfreeze wallet
router.patch("/:id/unfreeze", authenticate, authorize("ADMIN", "GOVERNMENT"), walletController.unfreezeWallet);

export default router;
