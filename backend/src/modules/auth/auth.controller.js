import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import * as authService from "./auth.service.js";
import { VERIFICATION_STATUS } from "../../constants/roles.constants.js";

/**
 * Register new user
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(
    ApiResponse.created({
      user: result.user,
      emailVerificationToken: result.emailVerificationToken, // Remove in production
      message:
        result.user.verificationStatus === VERIFICATION_STATUS.APPROVED
          ? "Registration successful. Please verify your email."
          : "Registration submitted. Awaiting admin approval.",
    }),
  );
});

/**
 * Login user
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Extract device info from request
  const deviceInfo = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("user-agent"),
  };

  const result = await authService.loginUser(email, password, deviceInfo);
  res.json(ApiResponse.success(result, "Login successful"));
});

/**
 * Refresh access token
 */
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json(ApiResponse.error("Refresh token required"));
  }

  const result = await authService.refreshAccessToken(refreshToken);
  res.json(ApiResponse.success(result, "Token refreshed successfully"));
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json(ApiResponse.error("Refresh token required"));
  }

  const result = await authService.logoutUser(req.user._id, refreshToken);
  res.json(ApiResponse.success(result));
});

/**
 * Logout from all devices
 */
export const logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllDevices(req.user._id);
  res.json(ApiResponse.success(result));
});

/**
 * Verify email
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json(ApiResponse.error("Verification token required"));
  }

  const result = await authService.verifyEmail(token);
  res.json(ApiResponse.success(result));
});

/**
 * Request password reset
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(ApiResponse.error("Email required"));
  }

  const result = await authService.requestPasswordReset(email);
  res.json(ApiResponse.success(result));
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json(ApiResponse.error("Token and new password required"));
  }

  const result = await authService.resetPassword(token, newPassword);
  res.json(ApiResponse.success(result));
});

/**
 * Get user sessions
 */
export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserSessions(req.user._id);
  res.json(ApiResponse.success({ sessions }));
});

/**
 * Get current user profile
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  res.json(ApiResponse.success(user));
});
