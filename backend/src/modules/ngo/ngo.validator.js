import { z } from "zod";

export const allocateDonationSchema = z.object({
  body: z.object({
    donationId: z.string(),

    beneficiaryId: z.string(),
  }),
});
