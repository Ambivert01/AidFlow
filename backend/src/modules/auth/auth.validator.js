import { z } from "zod";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

// Only DONOR can self-register via /auth/register
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name too short").max(50),
    email: z.string().email("Invalid email format"),
    password: z.string().regex(passwordRegex, "Password must contain uppercase, lowercase and number"),
    role: z.enum(["DONOR"]),
  }).strict(),
});

// NGO / MERCHANT / GOVERNMENT apply via /access/request
export const accessRequestSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().regex(passwordRegex, "Password must contain uppercase, lowercase and number"),
    role: z.enum(["NGO", "MERCHANT", "GOVERNMENT"]),
  }).strict(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});