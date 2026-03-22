import { z } from "zod";

export const spendWalletSchema = z.object({
  body: z.object({
    walletId: z.string(),

    merchantId: z.string(),

    amount: z.number().positive(),

    category: z.enum(["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"]),
  }),
});
