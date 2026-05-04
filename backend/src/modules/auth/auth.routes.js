import express from "express";
import * as authController from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.validator.js";
import {
  loginLimiter,
  authLimiter,
} from "../../middlewares/rateLimit.middleware.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";

const router = express.Router();

// Public registration (DONOR self-registers, others use /access/request)
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);

// Login
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login,
);

// Refresh access token (public, but requires valid refresh token)
router.post("/refresh", authLimiter, authController.refresh);

// Logout (requires authentication)
router.post("/logout", authenticate, authController.logout);

// Logout from all devices (requires authentication)
router.post("/logout-all", authenticate, authController.logoutAll);

// Email verification (public)
router.post("/verify-email", authLimiter, authController.verifyEmail);

// Password reset request (public)
router.post("/forgot-password", authLimiter, authController.forgotPassword);

// Password reset (public)
router.post("/reset-password", authLimiter, authController.resetPassword);

// Get user sessions (requires authentication)
router.get("/sessions", authenticate, authController.getSessions);

// Get current user profile (authenticated)
router.get("/me", authenticate, authController.getMe);

export default router;
