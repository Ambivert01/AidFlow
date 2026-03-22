import { z } from "zod";

export const registerMerchantSchema = z.object({
  body: z.object({
    shopName: z.string().min(3),

    category: z.enum(["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"]),

    location: z.object({
      state: z.string(),

      district: z.string(),

      ward: z.string().optional(),
    }),
  }),
});
