import { env } from "./env.config.js";

export const jwtConfig = {
  secret: env.JWT_SECRET,
  accessExpiry: env.JWT_EXPIRES_IN || "15m", // 15 minutes for access token
  refreshExpiry: "7d", // 7 days for refresh token
};
