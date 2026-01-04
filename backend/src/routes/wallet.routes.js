import express from "express";
import { getMyWallet } from "../controllers/wallet.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

/*
 * Beneficiary wallet
 */
router.get(
  "/me",
  authenticate,
  authorizeRoles("BENEFICIARY"),
  getMyWallet
);

export default router;
