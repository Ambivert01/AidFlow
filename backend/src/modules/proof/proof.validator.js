import { z } from "zod";
import { PROOF_TYPE, MANUAL_REVIEW_DECISION } from "./proof.constants.js";

// Upload proof schema
export const uploadProofSchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, "Campaign ID is required"),
    proofType: z.enum(
      [
        PROOF_TYPE.PURCHASE_RECEIPT,
        PROOF_TYPE.AID_DELIVERY,
        PROOF_TYPE.BENEFICIARY_CONFIRMATION,
        PROOF_TYPE.MERCHANT_INVOICE,
        PROOF_TYPE.FIELD_REPORT,
        PROOF_TYPE.OTHER,
      ],
      { required_error: "Proof type is required" },
    ),
    beneficiaryId: z.string().optional(),
    merchantId: z.string().optional(),
    transactionId: z.string().optional(),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
    capturedAt: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

// Get campaign proofs schema
export const getCampaignProofsSchema = z.object({
  params: z.object({
    campaignId: z.string().min(1, "Campaign ID is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

// Get donor timeline schema
export const getDonorTimelineSchema = z.object({
  params: z.object({
    donorId: z.string().min(1, "Donor ID is required"),
  }),
});

// Verify proof hash schema
export const verifyProofHashSchema = z.object({
  params: z.object({
    proofId: z.string().min(1, "Proof ID is required"),
  }),
});

// Submit manual review schema
export const submitManualReviewSchema = z.object({
  params: z.object({
    proofId: z.string().min(1, "Proof ID is required"),
  }),
  body: z.object({
    decision: z.enum(
      [MANUAL_REVIEW_DECISION.APPROVED, MANUAL_REVIEW_DECISION.REJECTED],
      { required_error: "Decision is required" },
    ),
    reason: z.string().optional(),
  }),
});
