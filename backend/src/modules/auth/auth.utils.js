import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

    { expiresIn: jwtConfig.accessExpiry }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      type: "REFRESH",
    },
    jwtConfig.secret,

    { expiresIn: jwtConfig.refreshExpiry }
  );
};