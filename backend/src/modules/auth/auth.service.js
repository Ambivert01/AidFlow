import { User } from "../../models/auth/User.model.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateVerificationToken,
  verifyToken,
  extractDeviceInfo,
} from "./auth.utils.js";
import { AppError } from "../../utils/AppError.js";
import { AUTH_ERRORS } from "./auth.constants.js";
import {
  ROLES,
  VERIFICATION_STATUS,
  requiresApproval,
} from "../../constants/roles.constants.js";
import { createAuditLog } from "../audit/audit.service.js";

/**
 * Register new user
 */
export const registerUser = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });

  if (existing)
    throw new AppError("Email already registered", 409, "DUPLICATE_EMAIL");

  const passwordHash = await hashPassword(data.password);

  // DONORS auto-approved so they can login immediately
  // All other roles (NGO, MERCHANT, GOVERNMENT) stay PENDING until admin approves
  const verificationStatus = requiresApproval(data.role)
    ? VERIFICATION_STATUS.PENDING
    : VERIFICATION_STATUS.APPROVED;

  // Generate email verification token
  const emailVerificationToken = generateVerificationToken();
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role,
    verificationStatus,
    isActive: true,
    emailVerified: false,
    emailVerificationToken: hashToken(emailVerificationToken),
    emailVerificationExpires,
  });

  // Create audit log
  await createAuditLog({
    eventType: "USER_REGISTERED",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: user._id.toString(),
    actorId: user._id.toString(),
    actorRole: user.role,
    payload: {
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    },
  });

  // TODO: Send verification email with token
  // For now, return the token (in production, this should be sent via email)
  return { user, emailVerificationToken };
};

/**
 * Login user with session management
 */
export const loginUser = async (email, password, deviceInfo = {}) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );

  if (!user)
    throw new AppError(
      AUTH_ERRORS.INVALID_CREDENTIALS,
      401,
      "INVALID_CREDENTIALS",
    );

  if (!user.isActive)
    throw new AppError(AUTH_ERRORS.ACCOUNT_DISABLED, 403, "ACCOUNT_DISABLED");

  if (user.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
    throw new AppError(
      "Account pending admin approval. You will be notified once approved.",
      403,
      "PENDING_APPROVAL",
    );
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid)
    throw new AppError(
      AUTH_ERRORS.INVALID_CREDENTIALS,
      401,
      "INVALID_CREDENTIALS",
    );

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token session
  await storeSession(user._id, refreshToken, deviceInfo);

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Create audit log
  await createAuditLog({
    eventType: "USER_LOGIN",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: user._id.toString(),
    actorId: user._id.toString(),
    actorRole: user.role,
    payload: {
      device: deviceInfo.device || "Unknown",
      ip: deviceInfo.ip || null,
    },
  });

  // Return user without passwordHash
  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  return { user: safeUser, accessToken, refreshToken };
};

/**
 * Store refresh token session
 */
export const storeSession = async (userId, refreshToken, deviceInfo = {}) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Hash refresh token before storing
  const refreshTokenHash = hashToken(refreshToken);

  // Calculate expiry (7 days from now)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Add session
  user.sessions.push({
    refreshTokenHash,
    device: deviceInfo.device || extractDeviceInfo(deviceInfo.userAgent),
    ip: deviceInfo.ip || null,
    userAgent: deviceInfo.userAgent || null,
    createdAt: new Date(),
    expiresAt,
    lastUsedAt: new Date(),
  });

  // Limit to 5 active sessions per user
  if (user.sessions.length > 5) {
    user.sessions = user.sessions.slice(-5);
  }

  await user.save();
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token
  const decoded = verifyToken(refreshToken);
  if (!decoded || decoded.type !== "REFRESH") {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  // Find user
  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw new AppError("User not found or inactive", 401, "USER_NOT_FOUND");
  }

  // Hash the provided refresh token
  const refreshTokenHash = hashToken(refreshToken);

  // Find matching session
  const session = user.sessions.find(
    (s) => s.refreshTokenHash === refreshTokenHash && s.expiresAt > new Date(),
  );

  if (!session) {
    throw new AppError(
      "Invalid or expired refresh token",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  // Update last used time
  session.lastUsedAt = new Date();
  await user.save();

  // Generate new access token
  const accessToken = generateAccessToken(user);

  return { accessToken };
};

/**
 * Logout user (revoke refresh token)
 */
export const logoutUser = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Hash the refresh token
  const refreshTokenHash = hashToken(refreshToken);

  // Remove the session
  user.sessions = user.sessions.filter(
    (s) => s.refreshTokenHash !== refreshTokenHash,
  );

  await user.save();

  // Create audit log
  await createAuditLog({
    eventType: "USER_LOGOUT",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: user._id.toString(),
    actorId: user._id.toString(),
    actorRole: user.role,
    payload: {},
  });

  return { message: "Logged out successfully" };
};

/**
 * Logout from all devices
 */
export const logoutAllDevices = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Clear all sessions
  user.sessions = [];
  await user.save();

  // Create audit log
  await createAuditLog({
    eventType: "USER_LOGOUT_ALL",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: user._id.toString(),
    actorId: user._id.toString(),
    actorRole: user.role,
    payload: {},
  });

  return { message: "Logged out from all devices successfully" };
};

/**
 * Verify email
 */
export const verifyEmail = async (token) => {
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken");

  if (!user) {
    throw new AppError(
      "Invalid or expired verification token",
      400,
      "INVALID_TOKEN",
    );
  }

  // Mark email as verified
  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  // Create audit log
  await createAuditLog({
    eventType: "EMAIL_VERIFIED",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: user._id.toString(),
    actorId: user._id.toString(),
    actorRole: user.role,
    payload: {
      email: user.email,
    },
  });

  return { message: "Email verified successfully" };
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists
    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  // Generate reset token
  const resetToken = generateVerificationToken();
  const resetTokenHash = hashToken(resetToken);

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Create audit log
  await createAuditLog({
    eventType: "PASSWORD_RESET_REQUESTED",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: user._id.toString(),
    actorId: user._id.toString(),
    actorRole: user.role,
    payload: {
      email: user.email,
    },
  });

  // TODO: Send reset email with token
  // For now, return the token (in production, this should be sent via email)
  return {
    message:
      "If an account with that email exists, a password reset link has been sent.",
    resetToken, // Remove this in production
  };
};

/**
 * Reset password
 */
export const resetPassword = async (token, newPassword) => {
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordHash");

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400, "INVALID_TOKEN");
  }

  // Hash new password
  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;

  // Revoke all sessions (force re-login)
  user.sessions = [];

  await user.save();

  // Create audit log
  await createAuditLog({
    eventType: "PASSWORD_RESET",
    eventCategory: "AUTH",
    entityType: "User",
    entityId: user._id.toString(),
    actorId: user._id.toString(),
    actorRole: user.role,
    payload: {
      email: user.email,
    },
  });

  return { message: "Password reset successfully. Please log in again." };
};

/**
 * Get user sessions
 */
export const getUserSessions = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Filter out expired sessions
  const activeSessions = user.sessions.filter((s) => s.expiresAt > new Date());

  // Return sessions without token hashes
  return activeSessions.map((s) => ({
    device: s.device,
    ip: s.ip,
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
    expiresAt: s.expiresAt,
  }));
};

/**
 * Get current user profile
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};
