/**
 * Public Audit Controller
 *
 * Handles public audit verification endpoints (no authentication required)
 */

import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import * as publicService from "./donation.public.service.js";
import { Donation } from "../../models/donor/Donation.model.js";

/**
 * @route   GET /public/audit/verify/:donationId
 * @desc    Get public audit trail for a donation
 * @access  Public
 */
const getPublicAuditTrail = asyncHandler(async (req, res) => {
  const { donationId } = req.params;

  const auditTrail = await publicService.getPublicAuditTrail(donationId);

  return ApiResponse.success(
    res,
    auditTrail,
    "Public audit trail retrieved successfully",
  );
});

/**
 * @route   GET /public/audit/blockchain/:donationId
 * @desc    Verify blockchain anchor for public audit
 * @access  Public
 */
const verifyBlockchainAnchor = asyncHandler(async (req, res) => {
  const { donationId } = req.params;

  const verification =
    await publicService.verifyPublicBlockchainAnchor(donationId);

  return ApiResponse.success(
    res,
    verification,
    "Blockchain verification completed",
  );
});

/**
 * @route   POST /public/audit/share/:donationId
 * @desc    Generate shareable URL for public audit
 * @access  Authenticated (donor only)
 */
const generateShareableUrl = asyncHandler(async (req, res) => {
  const { donationId } = req.params;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  // Verify user owns this donation
  const donation = await Donation.findById(donationId);

  if (!donation) {
    return ApiResponse.error(res, "Donation not found", 404);
  }

  if (donation.donor.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, "Unauthorized access", 403);
  }

  const shareableUrl = await publicService.generateShareableUrl(
    donationId,
    baseUrl,
  );

  return ApiResponse.success(
    res,
    shareableUrl,
    "Shareable URL generated successfully",
  );
});

/**
 * @route   GET /public/audit/verify-chain/:donationId
 * @desc    Verify hash chain integrity
 * @access  Public
 */
const verifyHashChain = asyncHandler(async (req, res) => {
  const { donationId } = req.params;

  const verification = await publicService.verifyHashChain(donationId);

  return ApiResponse.success(
    res,
    verification,
    "Hash chain verification completed",
  );
});

/**
 * @route   GET /public/audit/merkle/:donationId
 * @desc    Get merkle root for donation
 * @access  Public
 */
const getMerkleRoot = asyncHandler(async (req, res) => {
  const { donationId } = req.params;

  const auditTrail = await publicService.getPublicAuditTrail(donationId);

  return ApiResponse.success(
    res,
    {
      merkleRoot: auditTrail.merkleRoot,
      totalEvents: auditTrail.totalEvents,
      blockchainAnchor: auditTrail.blockchainAnchor,
    },
    "Merkle root retrieved successfully",
  );
});

export {
  getPublicAuditTrail,
  verifyBlockchainAnchor,
  generateShareableUrl,
  verifyHashChain,
  getMerkleRoot,
};
