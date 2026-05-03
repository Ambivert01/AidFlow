import { z } from "zod";

// Register Beneficiary Schema
export const registerBeneficiarySchema = z.object({
  body: z.object({
    campaignId: z.string().min(1, "Campaign ID is required"),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits"),
    aadhaar: z
      .string()
      .regex(/^[0-9]{12}$/, "Aadhaar must be exactly 12 digits")
      .optional(),
    location: z.object({
      ward: z.string().min(1, "Ward is required"),
      district: z.string().min(1, "District is required"),
      state: z.string().min(1, "State is required"),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
    household: z.object({
      familySize: z
        .number()
        .int()
        .min(1, "Family size must be at least 1")
        .max(50, "Family size must not exceed 50"),
      dependents: z.number().int().min(0).max(50).default(0),
      elderlyCount: z.number().int().min(0).max(50).default(0),
      childrenCount: z.number().int().min(0).max(50).default(0),
      disabledMembers: z.number().int().min(0).max(50).default(0),
    }),
    displacementStatus: z
      .enum(["DISPLACED", "PARTIAL", "STABLE", "UNKNOWN"])
      .default("UNKNOWN"),
    incomeLevel: z
      .enum(["NONE", "LOW", "MEDIUM", "UNKNOWN"])
      .default("UNKNOWN"),
    documents: z.array(z.string()).optional(),
  }),
});

// Reject Beneficiary Schema
export const rejectBeneficiarySchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(10, "Rejection reason must be at least 10 characters")
      .max(500, "Rejection reason must not exceed 500 characters"),
  }),
});

// Submit Appeal Schema
export const submitAppealSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(20, "Appeal reason must be at least 20 characters")
      .max(1000, "Appeal reason must not exceed 1000 characters"),
    documents: z.array(z.string()).optional(),
  }),
});

// Review Appeal Schema
export const reviewAppealSchema = z.object({
  body: z.object({
    decision: z.enum(["APPROVED", "REJECTED"], {
      errorMap: () => ({
        message: "Decision must be either APPROVED or REJECTED",
      }),
    }),
    reason: z
      .string()
      .min(10, "Decision reason must be at least 10 characters")
      .max(500, "Decision reason must not exceed 500 characters"),
  }),
});

// Bulk Upload Schema
export const bulkUploadSchema = z.object({
  body: z.object({
    beneficiaries: z
      .array(
        z.object({
          campaignId: z.string().min(1),
          name: z.string().min(2).max(100),
          phone: z.string().regex(/^[0-9]{10}$/),
          aadhaar: z
            .string()
            .regex(/^[0-9]{12}$/)
            .optional(),
          location: z.object({
            ward: z.string().min(1),
            district: z.string().min(1),
            state: z.string().min(1),
            lat: z.number().optional(),
            lng: z.number().optional(),
          }),
          household: z.object({
            familySize: z.number().int().min(1).max(50),
            dependents: z.number().int().min(0).max(50).default(0),
            elderlyCount: z.number().int().min(0).max(50).default(0),
            childrenCount: z.number().int().min(0).max(50).default(0),
            disabledMembers: z.number().int().min(0).max(50).default(0),
          }),
          displacementStatus: z
            .enum(["DISPLACED", "PARTIAL", "STABLE", "UNKNOWN"])
            .default("UNKNOWN"),
          incomeLevel: z
            .enum(["NONE", "LOW", "MEDIUM", "UNKNOWN"])
            .default("UNKNOWN"),
          documents: z.array(z.string()).optional(),
        }),
      )
      .min(1, "At least one beneficiary is required")
      .max(1000, "Maximum 1000 beneficiaries per upload"),
  }),
});

// Admin Block Schema
export const adminBlockSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(10, "Block reason must be at least 10 characters")
      .max(500, "Block reason must not exceed 500 characters"),
  }),
});

// Admin Override Schema
export const adminOverrideSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(10, "Override reason must be at least 10 characters")
      .max(500, "Override reason must not exceed 500 characters"),
  }),
});

// Get Beneficiaries Query Schema
export const getBeneficiariesQuerySchema = z.object({
  query: z.object({
    campaign: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    minAIScore: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0).max(100))
      .optional(),
    maxAIScore: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0).max(100))
      .optional(),
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional(),
  }),
});

// Get Statistics Query Schema
export const getStatisticsQuerySchema = z.object({
  query: z.object({
    campaign: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});
