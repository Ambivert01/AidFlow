import express from "express";
import * as authController from "./auth.controller.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  registerSchema,
  loginSchema,
} from "./auth.validator.js";

import {
  loginLimiter,
  authLimiter,
} from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// REGISTER
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);


// LOGIN
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login
);

export default router;