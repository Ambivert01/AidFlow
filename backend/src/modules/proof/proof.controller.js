import proofService from "./proof.service.js";
import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import { PROOF_ERROR_MESSAGES } from "./proof.constants.js";

/**
 * Upload proof with files
 * POST /api/proof/upload
 * @access NGO
 */
export const uploadProof = asyncHandler(async (req, res) => {
  const {
    campaignId,
    proofType,
    beneficiaryId,
    merchantId,
    transactionId,
    location,
    capturedAt,
    metadata,
  } = req.body;
  const files = req.files;
  const ngoId = req.user.id;
  const idempotencyKey = req.headers["x-idempotency-key"];

  // Validate files
  if (!files || files.length === 0) {
    throw new AppError("At least one file is required", 400);
  }

  // Parse location if provided as string
  let parsedLocation = location;
  if (typeof location === "string") {
    try {
      parsedLocation = JSON.parse(location);
    } catch (error) {
      throw new AppError("Invalid location format", 400);
    }
  }

  // Parse metadata if provided as string
  let parsedMetadata = metadata;
  if (typeof metadata === "string") {
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (error) {
      throw new AppError("Invalid metadata format", 400);
    }
  }

  const proof = await proofService.createProof(
    {
      campaignId,
      proofType,
      beneficiaryId,
      merchantId,
      transactionId,
      location: parsedLocation,
      capturedAt: capturedAt ? new Date(capturedAt) : undefined,
      metadata: parsedMetadata,
      idempotencyKey,
      ngoId,
    },
    files,
  );

  return ApiResponse.success(
    res,
    {
      proofId: proof._id,
      status: proof.status,
      files: proof.files.map((f) => ({
        fileUrl: f.fileUrl,
        fileType: f.fileType,
        size: f.size,
        checksum: f.checksum,
      })),
      createdAt: proof.createdAt,
    },
    "Proof uploaded successfully",
    200,
  );
});

/**
 * Get campaign proofs
 * GET /api/proof/campaign/:campaignId
 * @access Public
 */
export const getCampaignProofs = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const { page, limit } = req.query;

  const result = await proofService.getCampaignProofs(campaignId, {
    page,
    limit,
  });

  return ApiResponse.success(
    res,
    result,
    "Campaign proofs retrieved successfully",
  );
});

/**
 * Get donor proof timeline
 * GET /api/proof/donor/:donorId
 * @access Authenticated Donor
 */
export const getDonorProofTimeline = asyncHandler(async (req, res) => {
  const { donorId } = req.params;
  const authenticatedUserId = req.user.id;

  // Verify donor can only view own timeline
  if (donorId !== authenticatedUserId) {
    throw new AppError(
      "Forbidden: You can only view your own proof timeline",
      403,
    );
  }

  const result = await proofService.getDonorProofTimeline(donorId);

  return ApiResponse.success(
    res,
    result,
    "Donor proof timeline retrieved successfully",
  );
});

/**
 * Verify proof hash
 * GET /api/proof/:proofId/verify
 * @access Public
 */
export const verifyProofHash = asyncHandler(async (req, res) => {
  const { proofId } = req.params;

  const result = await proofService.verifyProofHash(proofId);

  return ApiResponse.success(res, result, "Proof hash verified successfully");
});

/**
 * Submit manual review
 * POST /api/proof/:proofId/review
 * @access Admin
 */
export const submitManualReview = asyncHandler(async (req, res) => {
  const { proofId } = req.params;
  const { decision, reason } = req.body;
  const reviewerId = req.user.id;

  const proof = await proofService.submitManualReview(
    proofId,
    decision,
    reason,
    reviewerId,
  );

  return ApiResponse.success(
    res,
    {
      proofId: proof._id,
      status: proof.status,
      manualReview: proof.manualReview,
    },
    "Manual review submitted successfully",
  );
});
