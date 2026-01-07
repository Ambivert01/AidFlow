import express from "express";
import {
  initiatePayment,
  confirmPayment,
  paymentHistory,
} from "../controllers/payments.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/initiate",
  authenticate,
  authorizeRoles("BENEFICIARY"),
  initiatePayment
);

router.post(
  "/confirm",
  authenticate,
  authorizeRoles("BENEFICIARY"),
  confirmPayment
);

router.get(
  "/history",
  authenticate,
  authorizeRoles("BENEFICIARY"),
  paymentHistory
);

export default router;
