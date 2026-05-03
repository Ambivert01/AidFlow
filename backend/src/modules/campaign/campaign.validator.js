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

    targetAmount: z
      .number()
      .positive("targetAmount must be greater than 0")
      .max(1000000000),

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

export const updateCampaignSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),

    description: z.string().min(20).optional(),

    disasterType: z
      .enum([
        "FLOOD",

        "EARTHQUAKE",

        "CYCLONE",

        "FIRE",

        "DROUGHT",

        "PANDEMIC",

        "WAR",

        "OTHER",
      ])
      .optional(),

    targetAmount: z
      .number()
      .positive("targetAmount must be greater than 0")
      .max(1000000000)
      .optional(),

    location: z
      .object({
        state: z.string(),

        district: z.string(),

        ward: z.string().optional(),
      })
      .optional(),

    policy: z
      .object({
        maxPerBeneficiary: z.number().positive(),

        maxPerTransaction: z.number().positive(),

        validityDays: z.number().positive(),

        allowedCategories: z.array(
          z.enum(["FOOD", "MEDICINE", "SHELTER", "WATER", "OTHER"]),
        ),
      })
      .optional(),
  }),
});
