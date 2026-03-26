import { User } from "../../models/auth/User.model.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from "./auth.utils.js";

import { AUTH_ERRORS } from "./auth.constants.js";

export const registerUser = async (data) => {
  const existing = await User.findOne({
    email: data.email.toLowerCase(),
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(data.password);

  const user = await User.create({
    name: data.name,

    email: data.email.toLowerCase(),

    passwordHash,

    role: data.role,

    /*
    ZERO TRUST MODEL
    every role needs approval
    except system-created admin
    */

    verificationStatus: "PENDING",

    isActive: true,
  });

  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+passwordHash");

  if (!user) {
    throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  /*
  account disabled check
  */

  if (!user.isActive) {
    throw new Error(AUTH_ERRORS.ACCOUNT_DISABLED);
  }

  /*
  ZERO TRUST LOGIN CONTROL
  only approved users allowed
  */

  if (user.verificationStatus !== "APPROVED") {
    throw new Error("Account pending admin approval");
  }

  /*
  password validation
  */

  const valid = await comparePassword(password, user.passwordHash);

  if (!valid) {
    throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  /*
  token generation
  */

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  /*
  login tracking
  */

  user.lastLoginAt = new Date();

  await user.save();

  return {
    user,

    accessToken,

    refreshToken,
  };
};
