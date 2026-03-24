import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: "Too many login attempts. Try again later.",
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many login attempts",
});

export const donationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many donations",
});

export const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many wallet requests",
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
