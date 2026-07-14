import { z } from "zod";
import {
  ROLES,
  canSelfRegister,
  requiresApproval,
} from "../../constants/roles.constants.js";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

const passwordValidation = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(
    passwordRegex,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  );

// DONOR and BENEFICIARY can self-register via /auth/register.
// (NGO / MERCHANT / GOVERNMENT go through /access/request below instead,
// since those roles require admin approval before they can log in.)
export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, "Name too short").max(50),
      email: z.string().email("Invalid email format"),
      password: passwordValidation,
      phone: z
        .string()
        .regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits")
        .optional(),
      role: z.enum([ROLES.DONOR, ROLES.BENEFICIARY]),
    })
    .strict(),
});

// NGO / MERCHANT / GOVERNMENT apply via /access/request
export const accessRequestSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      password: passwordValidation,
      role: z.enum([ROLES.NGO, ROLES.MERCHANT, ROLES.GOVERNMENT]),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});
