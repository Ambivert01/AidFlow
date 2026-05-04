import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { jwtConfig } from "../../config/jwt.config.js";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      type: "ACCESS",
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.accessExpiry },
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      type: "REFRESH",
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.refreshExpiry },
  );
};

/**
 * Hash refresh token before storing in database
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate random verification token
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
};

/**
 * Extract device info from user agent
 */
export const extractDeviceInfo = (userAgent) => {
  if (!userAgent) return "Unknown Device";

  // Simple device detection
  if (userAgent.includes("Mobile")) return "Mobile Device";
  if (userAgent.includes("Tablet")) return "Tablet";
  if (userAgent.includes("Windows")) return "Windows PC";
  if (userAgent.includes("Mac")) return "Mac";
  if (userAgent.includes("Linux")) return "Linux";

  return "Unknown Device";
};
