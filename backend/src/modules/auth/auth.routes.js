import express from "express";
import * as authController from "./auth.controller.js";
import { loginLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", loginLimiter, authController.register);

router.post("/login", authController.login);

export default router;