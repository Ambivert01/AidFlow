import express from "express";
import {
  getMyWallet,
  getWalletTransactions,
  generateQRToken,
  scanQR,
  confirmPayment,
} from "../controllers/wallet.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Beneficiary wallet routes
router.get("/wallet/me", authenticate, authorizeRoles("BENEFICIARY"), getMyWallet);
router.get("/wallet/transactions", authenticate, authorizeRoles("BENEFICIARY"), getWalletTransactions);
router.post("/wallet/qr", authenticate, authorizeRoles("BENEFICIARY"), generateQRToken);

// Payment routes (merchant scans QR, merchant confirms)
router.post("/payments/scan", authenticate, authorizeRoles("MERCHANT"), scanQR);
router.post("/payments/confirm", authenticate, authorizeRoles("MERCHANT"), confirmPayment);

export default router;
