import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import * as authService from "./auth.service.js";
import { VERIFICATION_STATUS } from "../../constants/roles.constants.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json(
    ApiResponse.created({
      user,
      message:
        user.verificationStatus === VERIFICATION_STATUS.APPROVED
          ? "Registration successful. You can now log in."
          : "Registration submitted. Awaiting admin approval.",
    }),
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  res.json(ApiResponse.success(result, "Login successful"));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json(ApiResponse.success(user));
});
