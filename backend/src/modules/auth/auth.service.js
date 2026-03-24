import { User } from "../../models/auth/User.model.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from "./auth.utils.js";

import { AUTH_ERRORS } from "./auth.constants.js";

export const registerUser = async (data) => {
  const existing = await User.findOne({ email: data.email });

  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new Error(AUTH_ERRORS.ACCOUNT_DISABLED);
  }

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) {
    throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};