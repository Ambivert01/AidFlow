import { z } from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

export const registerSchema = z.object({

  body: z.object({

    name: z.string()
      .min(2, "Name too short")
      .max(50),

    email: z.string()
      .email("Invalid email format")
      .toLowerCase(),

    password: z.string()
      .regex(
        passwordRegex,
        "Password must contain uppercase, lowercase and number"
      ),

    role: z.enum([
      "ADMIN",
      "GOVERNMENT",
      "NGO",
      "DONOR",
      "BENEFICIARY",
      "MERCHANT",
    ]),

  }).strict() // prevents extra fields injection

});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});