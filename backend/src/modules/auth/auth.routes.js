import express from "express";
import * as authController from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.validator.js";
import { loginLimiter, authLimiter } from "../../middlewares/rateLimit.middleware.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";

const router = express.Router();

// Public registration (DONOR self-registers, others use /access/request)
router.post("/register", authLimiter, validate(registerSchema), authController.register);

// Login
router.post("/login", loginLimiter, validate(loginSchema), authController.login);

// Get current user profile (authenticated)
router.get("/me", authenticate, authController.getMe);

export default router;