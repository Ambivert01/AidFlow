import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      type: "REFRESH",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};