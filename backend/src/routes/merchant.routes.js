import express from "express";
import { spendFromWallet } from "../controllers/merchant.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/spend",
  authenticate,
  authorizeRoles("MERCHANT"),
  spendFromWallet
);

export default router;
