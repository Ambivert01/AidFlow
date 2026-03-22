import { z } from "zod";

export const registerBeneficiarySchema = z.object({
  body: z.object({
    campaignId: z.string(),

    name: z.string().min(2),

    phone: z.string().min(10),

    familySize: z.number().min(1),

    displacementStatus: z.enum(["DISPLACED", "PARTIAL", "STABLE", "UNKNOWN"]),

    location: z.object({
      state: z.string(),

      district: z.string(),

      ward: z.string().optional(),

      lat: z.number().optional(),

      lng: z.number().optional(),
    }),
  }),
});
