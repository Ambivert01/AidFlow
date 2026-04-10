import express from "express";
import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { accessRequestSchema } from "./auth.validator.js";
import { registerUser } from "./auth.service.js";
import { authLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// NGO / MERCHANT / GOVERNMENT submit access request
// Creates user with verificationStatus: PENDING — admin must approve before they can login
router.post(
  "/request",
  authLimiter,
  validate(accessRequestSchema),
  asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    res.status(201).json(ApiResponse.created({
      message: "Access request submitted. An admin will review and approve your account.",
      email: user.email,
      role: user.role,
    }));
  })
);

export default router;
