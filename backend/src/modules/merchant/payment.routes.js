import express from "express";
import { asyncHandler } from "../../core/asyncHandler.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import * as paymentService from "./payment.service.js";

const router = express.Router();

// Beneficiary generates QR token for their wallet
router.post(
  "/qr",
  authenticate,
  authorize("BENEFICIARY"),
  asyncHandler(async (req, res) => {
    const result = await paymentService.generateQRToken(req.user._id, req.body.walletId);
    res.json(result);
  })
);

// Merchant scans QR — verifies token, returns wallet info
router.post(
  "/scan",
  authenticate,
  authorize("MERCHANT"),
  asyncHandler(async (req, res) => {
    const result = await paymentService.scanQRToken(req.user._id, req.body.qrToken);
    res.json(result);
  })
);

// Merchant confirms payment
router.post(
  "/confirm",
  authenticate,
  authorize("MERCHANT"),
  asyncHandler(async (req, res) => {
    const result = await paymentService.confirmPayment(req.user._id, req.body);
    res.json(result);
  })
);

// Merchant views own transactions
router.get(
  "/transactions",
  authenticate,
  authorize("MERCHANT"),
  asyncHandler(async (req, res) => {
    const result = await paymentService.getMerchantTransactions(req.user._id);
    res.json(result);
  })
);

export default router;
