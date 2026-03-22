import { env } from "./env.config.js";

export const jwtConfig = {

  secret: env.JWT_SECRET,

  accessExpiry: env.JWT_EXPIRES_IN,

  refreshExpiry: "30d",

};