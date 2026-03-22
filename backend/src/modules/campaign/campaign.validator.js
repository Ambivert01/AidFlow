import { z } from "zod";

export const createCampaignSchema = z.object({
  body: z.object({
    title: z.string().min(5),

    description: z.string().min(20),

    disasterType: z.enum([
      "FLOOD",

      "EARTHQUAKE",

      "CYCLONE",

      "FIRE",

      "DROUGHT",

      "PANDEMIC",

      "WAR",

      "OTHER",
    ]),

    location: z.object({
      state: z.string(),

      district: z.string(),

      ward: z.string().optional(),
    }),

    policy: z.object({
      maxPerBeneficiary: z.number().positive(),

      maxPerTransaction: z.number().positive(),

      validityDays: z.number().positive(),

      allowedCategories: z.array(
        z.enum(["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"]),
      ),
    }),
  }),
});
