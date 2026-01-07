import express from "express";
import {
  spendFromWallet,
  getMerchantTransactions,
} from "../controllers/merchant.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/*
 * Spend from beneficiary wallet
 * MERCHANT only
 */
router.post(
  "/spend",
  authenticate,
  authorizeRoles("MERCHANT"),
  spendFromWallet
);

/*
 * Merchant transaction history
 */
router.get(
  "/transactions",
  authenticate,
  authorizeRoles("MERCHANT"),
  getMerchantTransactions
);

export default router;
