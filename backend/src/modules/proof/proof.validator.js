import { z } from "zod";

export const uploadProofSchema = z.object({
  body: z.object({
    donationId: z.string(),

    beneficiaryId: z.string(),

    type: z.enum([
      "IMAGE",

      "PDF",

      "RECEIPT",

      "GEO_TAG",

      "BENEFICIARY_CONFIRMATION",
    ]),

    fileUrl: z.string().url(),

    geoLocation: z
      .object({
        lat: z.number(),

        lng: z.number(),
      })
      .optional(),
  }),
});
