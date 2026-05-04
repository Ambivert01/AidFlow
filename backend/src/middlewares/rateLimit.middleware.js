import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: "Too many login attempts. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many login attempts",
  standardHeaders: true,
  legacyHeaders: false,
});

export const donationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many donations",
  standardHeaders: true,
  legacyHeaders: false,
});

export const walletLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per beneficiary
  // Remove custom keyGenerator - let express-rate-limit handle IP properly
  // User ID will be handled by the route if needed
  message: "Too many spending requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

/*
import express from "express";
import helmet from "helmet";
import hpp from "hpp";

const app = express();

app.use(helmet());
app.use(hpp());

app.use(express.json());
*/
