/**
 * Proof Integration Service for Donor Tracking System
 * Links proofs to donations and extracts proof metadata
 */

import { Proof } from "../../models/proofs/Proof.model.js";

/**
 * Get proofs for a donation's campaign
 * @param {String} campaignId - Campaign ID
 * @param {Object} options - Query options
 * @returns {Array} - Proof documents with metadata
 */
export const getProofsForCampaign = async (campaignId, options = {}) => {
  try {
    const query = { campaign: campaignId };

    // Apply status filter if provided
    if (options.status) {
      query.status = options.status;
    }

    // Apply proof type filter if provided
    if (options.proofType) {
      query.proofType = options.proofType;
    }

    const proofs = await Proof.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 100)
      .lean();

    return proofs.map((proof) => extractProofMetadata(proof));
  } catch (error) {
    console.error("[ProofIntegrator] Error fetching proofs:", error);
    return [];
  }
};

/**
 * Get a single proof by ID with full metadata
 * @param {String} proofId - Proof ID
 * @returns {Object|null} - Proof with metadata
 */
export const getProofById = async (proofId) => {
  try {
    const proof = await Proof.findById(proofId).lean();

    if (!proof) {
      return null;
    }

    return extractProofMetadata(proof);
  } catch (error) {
    console.error("[ProofIntegrator] Error fetching proof:", error);
    return null;
  }
};

/**
 * Extract proof metadata for timeline display
 * @param {Object} proof - Proof document
 * @returns {Object} - Proof metadata
 */
function extractProofMetadata(proof) {
  return {
    id: proof._id,
    proofType: proof.proofType,
    status: proof.status,

    // File metadata
    files:
      proof.files?.map((file) => ({
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        mimeType: file.mimeType,
        size: file.size,
        checksum: file.checksum,
      })) || [],

    // Timestamps
    uploadedAt: proof.createdAt,
    capturedAt: proof.capturedAt,

    // Location data
    location: proof.location
      ? {
          lat: proof.location.lat,
          lng: proof.location.lng,
          geoHash: proof.location.geoHash,
        }
      : null,

    // AI validation results
    aiValidation: proof.aiValidation
      ? {
          verified: proof.aiValidation.verified,
          confidenceScore: proof.aiValidation.confidenceScore,
          fraudProbability: proof.aiValidation.fraudProbability,
          flags: proof.aiValidation.flags || [],
          evaluatedAt: proof.aiValidation.evaluatedAt,
        }
      : null,

    // Manual review results
    manualReview: proof.manualReview?.reviewedBy
      ? {
          decision: proof.manualReview.decision,
          reason: proof.manualReview.reason,
          reviewedAt: proof.manualReview.reviewedAt,
          reviewedBy: proof.manualReview.reviewedBy,
        }
      : null,

    // Blockchain data
    blockchainTxHash: proof.blockchainTxHash,
    hash: proof.hash,

    // Related entities
    campaign: proof.campaign,
    wallet: proof.wallet,
    transaction: proof.transaction,
    beneficiary: proof.beneficiary,
    merchant: proof.merchant,
  };
}

/**
 * Get proof statistics for a campaign
 * @param {String} campaignId - Campaign ID
 * @returns {Object} - Proof statistics
 */
export const getProofStatistics = async (campaignId) => {
  try {
    const proofs = await Proof.find({ campaign: campaignId }).lean();

    const stats = {
      total: proofs.length,
      byStatus: {},
      byType: {},
      aiVerified: 0,
      manuallyReviewed: 0,
      withLocation: 0,
      blockchainAnchored: 0,
    };

    // Calculate statistics
    for (const proof of proofs) {
      // Count by status
      stats.byStatus[proof.status] = (stats.byStatus[proof.status] || 0) + 1;

      // Count by type
      stats.byType[proof.proofType] = (stats.byType[proof.proofType] || 0) + 1;

      // Count AI verified
      if (proof.aiValidation?.verified) {
        stats.aiVerified++;
      }

      // Count manually reviewed
      if (proof.manualReview?.reviewedBy) {
        stats.manuallyReviewed++;
      }

      // Count with location
      if (proof.location?.lat && proof.location?.lng) {
        stats.withLocation++;
      }

      // Count blockchain anchored
      if (proof.blockchainTxHash) {
        stats.blockchainAnchored++;
      }
    }

    return stats;
  } catch (error) {
    console.error(
      "[ProofIntegrator] Error calculating proof statistics:",
      error,
    );
    return {
      total: 0,
      byStatus: {},
      byType: {},
      aiVerified: 0,
      manuallyReviewed: 0,
      withLocation: 0,
      blockchainAnchored: 0,
    };
  }
};

/**
 * Link proofs to donation timeline events
 * @param {Array} proofs - Proof documents
 * @param {String} donationId - Donation ID
 * @returns {Array} - Timeline events for proofs
 */
export const createProofTimelineEvents = (proofs, donationId) => {
  const events = [];

  for (const proof of proofs) {
    // Proof uploaded event
    events.push({
      event: "PROOF_UPLOADED",
      eventCategory: "PROOF",
      timestamp: proof.createdAt,
      status: proof.status,
      actor: {
        role: "NGO",
      },
      payload: {
        proofId: proof._id,
        proofType: proof.proofType,
        fileCount: proof.files?.length || 0,
        location: proof.location,
        capturedAt: proof.capturedAt,
      },
      relatedProof: extractProofMetadata(proof),
    });

    // Proof AI validation event
    if (proof.aiValidation?.evaluatedAt) {
      events.push({
        event: proof.aiValidation.verified
          ? "PROOF_VERIFIED"
          : "PROOF_REJECTED",
        eventCategory: "PROOF",
        timestamp: proof.aiValidation.evaluatedAt,
        status: proof.status,
        actor: {
          role: "AI",
          name: "AI Proof Validator",
        },
        payload: {
          proofId: proof._id,
          verified: proof.aiValidation.verified,
          confidenceScore: proof.aiValidation.confidenceScore,
          fraudProbability: proof.aiValidation.fraudProbability,
          flags: proof.aiValidation.flags || [],
        },
        relatedProof: extractProofMetadata(proof),
      });
    }

    // Proof manual review event
    if (proof.manualReview?.reviewedAt) {
      events.push({
        event:
          proof.manualReview.decision === "APPROVED"
            ? "PROOF_VERIFIED"
            : "PROOF_REJECTED",
        eventCategory: "PROOF",
        timestamp: proof.manualReview.reviewedAt,
        status: proof.status,
        actor: {
          role: "NGO",
          userId: proof.manualReview.reviewedBy,
        },
        payload: {
          proofId: proof._id,
          decision: proof.manualReview.decision,
          reason: proof.manualReview.reason,
        },
        relatedProof: extractProofMetadata(proof),
      });
    }
  }

  return events;
};

/**
 * Get proof file URL with validation
 * @param {Object} proof - Proof document
 * @param {Number} fileIndex - File index (default: 0)
 * @returns {String|null} - File URL or null
 */
export const getProofFileUrl = (proof, fileIndex = 0) => {
  if (!proof.files || proof.files.length === 0) {
    return null;
  }

  const file = proof.files[fileIndex];
  return file?.fileUrl || null;
};

/**
 * Check if proof has AI validation
 * @param {Object} proof - Proof document
 * @returns {Boolean} - True if AI validated
 */
export const hasAIValidation = (proof) => {
  return !!(proof.aiValidation && proof.aiValidation.evaluatedAt);
};

/**
 * Check if proof has manual review
 * @param {Object} proof - Proof document
 * @returns {Boolean} - True if manually reviewed
 */
export const hasManualReview = (proof) => {
  return !!(proof.manualReview && proof.manualReview.reviewedBy);
};

/**
 * Get proof verification status
 * @param {Object} proof - Proof document
 * @returns {String} - Verification status (VERIFIED, REJECTED, PENDING, FLAGGED)
 */
export const getProofVerificationStatus = (proof) => {
  if (proof.status === "APPROVED") {
    return "VERIFIED";
  }

  if (proof.status === "REJECTED") {
    return "REJECTED";
  }

  if (proof.status === "FLAGGED") {
    return "FLAGGED";
  }

  if (proof.status === "MANUAL_REVIEW") {
    return "PENDING_REVIEW";
  }

  return "PENDING";
};
