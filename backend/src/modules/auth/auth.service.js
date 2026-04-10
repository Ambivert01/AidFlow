import { User } from "../../models/auth/User.model.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from "./auth.utils.js";
import { AppError } from "../../utils/AppError.js";
import { AUTH_ERRORS } from "./auth.constants.js";

export const registerUser = async (data) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });

  if (existing) throw new AppError("Email already registered", 409, "DUPLICATE_EMAIL");

  const passwordHash = await hashPassword(data.password);

  // DONORS auto-approved so they can login immediately
  // All other roles (NGO, MERCHANT, GOVERNMENT) stay PENDING until admin approves
  const verificationStatus = data.role === "DONOR" ? "APPROVED" : "PENDING";

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role,
    verificationStatus,
    isActive: true,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

  if (!user) throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS, 401, "INVALID_CREDENTIALS");

  if (!user.isActive) throw new AppError(AUTH_ERRORS.ACCOUNT_DISABLED, 403, "ACCOUNT_DISABLED");

  if (user.verificationStatus !== "APPROVED") {
    throw new AppError("Account pending admin approval. You will be notified once approved.", 403, "PENDING_APPROVAL");
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) throw new AppError(AUTH_ERRORS.INVALID_CREDENTIALS, 401, "INVALID_CREDENTIALS");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.lastLoginAt = new Date();
  await user.save();

  // Return user without passwordHash
  const safeUser = user.toObject();
  delete safeUser.passwordHash;

  return { user: safeUser, accessToken, refreshToken };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};
