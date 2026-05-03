import { z } from "zod";

export const createWalletSchema = z.object({
  body: z.object({
    beneficiaryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid beneficiary ID"),
    campaignId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid campaign ID"),
    amount: z.number().positive().min(1).max(1000000),
    idempotencyKey: z.string().optional(),
    policy: z
      .object({
        allowedMerchants: z.array(z.string()).optional(),
        maxDistanceKm: z.number().positive().optional(),
        allowedDistricts: z.array(z.string()).optional(),
      })
      .optional(),
  }),
});

export const spendWalletSchema = z.object({
  body: z.object({
    walletId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid wallet ID"),
    merchantId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid merchant ID"),
    amount: z.number().positive(),
    category: z.enum(["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"]),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    idempotencyKey: z.string().optional(),
    deviceId: z.string().optional(),
    ipAddress: z.string().optional(),
  }),
});

export const creditWalletSchema = z.object({
  body: z.object({
    amount: z.number().positive().min(1),
  }),
});

export const adjustWalletSchema = z.object({
  body: z.object({
    amount: z.number(), // Can be positive or negative
    reason: z.string().min(1).max(500),
  }),
});

export const closeWalletSchema = z.object({
  body: z.object({
    reason: z.string().min(1).max(500),
  }),
});

export const freezeWalletSchema = z.object({
  body: z.object({
    reason: z.string().min(1).max(500),
  }),
});

export const getTransactionsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
