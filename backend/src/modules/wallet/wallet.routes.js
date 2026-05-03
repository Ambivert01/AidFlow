import express from "express";
import { asyncHandler } from "../../core/asyncHandler.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as walletController from "./wallet.controller.js";
import {
  createWalletSchema,
  spendWalletSchema,
  creditWalletSchema,
  adjustWalletSchema,
  closeWalletSchema,
  freezeWalletSchema,
  getTransactionsSchema,
} from "./wallet.validator.js";
import { walletLimiter } from "../../middlewares/rateLimit.middleware.js";
import { idempotencyMiddleware } from "../../middlewares/idempotency.middleware.js";
import { generateQRToken } from "../merchant/payment.service.js";

const router = express.Router();

// NGO creates wallet for approved beneficiary
router.post(
  "/create",
  authenticate,
  authorize("NGO"),
  idempotencyMiddleware,
  validate(createWalletSchema),
  walletController.createWallet,
);

// Beneficiary spends wallet at merchant
router.post(
  "/spend",
  authenticate,
  authorize("BENEFICIARY"),
  walletLimiter,
  idempotencyMiddleware,
  validate(spendWalletSchema),
  walletController.spendWallet,
);

// NGO credits additional funds to wallet
router.post(
  "/:walletId/credit",
  authenticate,
  authorize("NGO"),
  validate(creditWalletSchema),
  walletController.creditWallet,
);

// Admin adjusts wallet balance
router.post(
  "/:walletId/adjust",
  authenticate,
  authorize("ADMIN"),
  validate(adjustWalletSchema),
  walletController.adjustWallet,
);

// Admin closes wallet
router.post(
  "/:walletId/close",
  authenticate,
  authorize("ADMIN"),
  validate(closeWalletSchema),
  walletController.closeWallet,
);

// Admin / Government freeze wallet
router.post(
  "/:walletId/freeze",
  authenticate,
  authorize("ADMIN", "GOVERNMENT"),
  validate(freezeWalletSchema),
  walletController.freezeWallet,
);

// Admin / Government unfreeze wallet
router.post(
  "/:walletId/unfreeze",
  authenticate,
  authorize("ADMIN", "GOVERNMENT"),
  walletController.unfreezeWallet,
);

// Beneficiary views own wallet
router.get(
  "/",
  authenticate,
  authorize("BENEFICIARY"),
  walletController.getMyWallet,
);

// Beneficiary views own transaction history
router.get(
  "/transactions",
  authenticate,
  authorize("BENEFICIARY"),
  validate(getTransactionsSchema),
  walletController.getMyTransactions,
);

// Beneficiary generates QR token
router.post(
  "/qr",
  authenticate,
  authorize("BENEFICIARY"),
  asyncHandler(async (req, res) => {
    const result = await generateQRToken(req.user._id, req.body.walletId);
    res.json(result);
  }),
);

export default router;
