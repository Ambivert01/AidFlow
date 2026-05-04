import { Proof } from "../../models/proofs/Proof.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { IdempotencyKey } from "../../models/IdempotencyKey.model.js";
import fileStorageService from "../../services/fileStorage.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import { createNotification } from "../notification/notification.service.js";
import trustService from "../trust/trust.service.js";
import {
  proofValidationQueue,
  blockchainQueue,
} from "../../queues/proof.queue.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";
import {
  PROOF_STATUS,
  PROOF_TYPE,
  AI_DECISION,
  MANUAL_REVIEW_DECISION,
  PROOF_AUDIT_EVENTS,
  PROOF_NOTIFICATION_TYPES,
  PROOF_ERROR_MESSAGES,
  PAGINATION,
} from "./proof.constants.js";

class ProofService {
  /**
   * Create a new proof with file uploads
   * @param {Object} data - Proof data
   * @param {Array} files - Uploaded files
   * @returns {Promise<Object>} Created proof
   */
  async createProof(data, files) {
    const {
      campaignId,
      proofType,
      beneficiaryId,
      merchantId,
      transactionId,
      location,
      capturedAt,
      metadata,
      idempotencyKey,
      ngoId,
    } = data;

    // 1. Check idempotency
    if (idempotencyKey) {
      const existing = await this.checkIdempotency(idempotencyKey);
      if (existing) {
        logger.info({
          type: "PROOF_IDEMPOTENCY_HIT",
          idempotencyKey,
          proofId: existing._id,
        });
        return existing;
      }
    }

    // 2. Validate campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new AppError(PROOF_ERROR_MESSAGES.CAMPAIGN_NOT_FOUND, 404);
    }
    if (campaign.ngo.toString() !== ngoId) {
      throw new AppError(PROOF_ERROR_MESSAGES.CAMPAIGN_UNAUTHORIZED, 403);
    }

    // 3. Store files and compute hashes
    const storedFiles = [];
    for (const file of files) {
      try {
        const fileUrl = await fileStorageService.storeFile(
          file.buffer,
          file.originalname,
          file.mimetype,
        );
        const checksum = fileStorageService.computeFileHash(file.buffer);

        storedFiles.push({
          fileUrl,
          fileType: this.detectFileType(file.mimetype),
          mimeType: file.mimetype,
          size: file.size,
          checksum,
          metadata: {},
        });
      } catch (error) {
        logger.error({
          type: "FILE_STORAGE_ERROR",
          filename: file.originalname,
          error: error.message,
        });
        throw new AppError(PROOF_ERROR_MESSAGES.FILE_UPLOAD_FAILED, 500);
      }
    }

    // 4. Create proof record
    const proof = await Proof.create({
      campaign: campaignId,
      beneficiary: beneficiaryId,
      merchant: merchantId,
      transaction: transactionId,
      proofType,
      files: storedFiles,
      location,
      capturedAt: capturedAt || new Date(),
      status: PROOF_STATUS.UPLOADED,
      hash: storedFiles[0].checksum, // Primary file hash
      metadata: metadata || {},
    });

    // 5. Create audit log
    await createAuditLog({
      eventType: PROOF_AUDIT_EVENTS.PROOF_UPLOADED,
      actorId: ngoId,
      actorRole: "NGO",
      entityType: "Proof",
      entityId: proof._id,
      campaignId,
      payload: {
        campaignId,
        proofType,
        fileCount: storedFiles.length,
        totalSize: storedFiles.reduce((sum, f) => sum + f.size, 0),
      },
    });

    // 6. Queue AI validation
    await proofValidationQueue.add(
      "proof-validation",
      {
        proofId: proof._id.toString(),
        fileUrls: storedFiles.map((f) => f.fileUrl),
        proofType,
        campaignId: campaignId.toString(),
        location,
        capturedAt: capturedAt || new Date(),
        campaignLocation: campaign.location,
        campaignPeriod: {
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );

    // 7. Update status to UNDER_VALIDATION
    proof.status = PROOF_STATUS.UNDER_VALIDATION;
    await proof.save();

    // 8. Store idempotency key
    if (idempotencyKey) {
      await this.storeIdempotency(idempotencyKey, proof._id);
    }

    logger.info({
      type: "PROOF_CREATED",
      proofId: proof._id,
      campaignId,
      ngoId,
      fileCount: storedFiles.length,
    });

    return proof;
  }

  /**
   * Update proof status from AI validation results
   * @param {string} proofId - Proof ID
   * @param {Object} aiResult - AI validation result
   * @returns {Promise<Object>} Updated proof
   */
  async updateProofFromAI(proofId, aiResult) {
    const proof = await Proof.findById(proofId).populate("campaign");
    if (!proof) {
      throw new AppError(PROOF_ERROR_MESSAGES.PROOF_NOT_FOUND, 404);
    }

    const oldStatus = proof.status;

    // Update AI validation fields
    proof.aiValidation = {
      verified: aiResult.decision === AI_DECISION.VERIFIED,
      confidenceScore: aiResult.confidenceScore,
      fraudProbability: aiResult.fraudProbability,
      flags: aiResult.flags,
      evaluatedAt: new Date(),
    };

    // Update status based on decision
    if (aiResult.decision === AI_DECISION.VERIFIED) {
      proof.status = PROOF_STATUS.AI_VERIFIED;

      // Queue blockchain anchoring
      await blockchainQueue.add(
        "proof-blockchain-anchor",
        {
          proofId: proof._id.toString(),
          hash: proof.hash,
          campaignId: proof.campaign._id.toString(),
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        },
      );

      // Notify donors
      await this.notifyDonorsOfVerifiedProof(proof);

      // Update trust scores for campaign and NGO
      try {
        await Promise.all([
          trustService.updateTrustScore(
            proof.campaign._id,
            "CAMPAIGN",
            "Proof verified by AI",
            "PROOF_VERIFIED",
            null,
          ),
          trustService.updateTrustScore(
            proof.campaign.createdBy,
            "NGO",
            "Proof verified by AI",
            "PROOF_VERIFIED",
            null,
          ),
        ]);
      } catch (trustError) {
        logger.error({
          type: "TRUST_UPDATE_ERROR",
          proofId: proof._id,
          error: trustError.message,
        });
        // Don't throw - trust update failure shouldn't block proof verification
      }
    } else if (aiResult.decision === AI_DECISION.REJECTED) {
      proof.status = PROOF_STATUS.REJECTED;

      // Notify NGO
      await createNotification({
        userId: proof.campaign.ngo,
        role: "NGO",
        type: PROOF_NOTIFICATION_TYPES.PROOF_REJECTED,
        title: "Proof Rejected",
        message: `Proof rejected for campaign ${proof.campaign.title}. Reason: ${aiResult.flags.join(", ")}`,
        entityType: "Proof",
        entityId: proof._id.toString(),
        channels: ["IN_APP", "EMAIL"],
        priority: "HIGH",
      });

      // Update trust scores for campaign and NGO (negative impact)
      try {
        await Promise.all([
          trustService.updateTrustScore(
            proof.campaign._id,
            "CAMPAIGN",
            "Proof rejected by AI",
            "PROOF_REJECTED",
            null,
          ),
          trustService.updateTrustScore(
            proof.campaign.createdBy,
            "NGO",
            "Proof rejected by AI",
            "PROOF_REJECTED",
            null,
          ),
        ]);
      } catch (trustError) {
        logger.error({
          type: "TRUST_UPDATE_ERROR",
          proofId: proof._id,
          error: trustError.message,
        });
      }
    } else {
      proof.status = PROOF_STATUS.FLAGGED;
    }

    await proof.save();

    // Create audit log
    await createAuditLog({
      eventType: PROOF_AUDIT_EVENTS.PROOF_STATUS_CHANGED,
      actorRole: "SYSTEM",
      entityType: "Proof",
      entityId: proof._id,
      campaignId: proof.campaign._id,
      payload: {
        oldStatus,
        newStatus: proof.status,
        aiResult,
      },
    });

    logger.info({
      type: "PROOF_AI_VALIDATION_COMPLETE",
      proofId: proof._id,
      decision: aiResult.decision,
      oldStatus,
      newStatus: proof.status,
    });

    return proof;
  }

  /**
   * Get campaign proofs (verified only)
   * @param {string} campaignId - Campaign ID
   * @param {Object} options - Query options (page, limit)
   * @returns {Promise<Object>} Proofs and pagination
   */
  async getCampaignProofs(campaignId, options = {}) {
    const page = parseInt(options.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      parseInt(options.limit) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const query = {
      campaign: campaignId,
      status: { $in: [PROOF_STATUS.AI_VERIFIED, PROOF_STATUS.APPROVED] },
    };

    const [proofs, total] = await Promise.all([
      Proof.find(query)
        .sort({ capturedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("beneficiary", "name")
        .populate("merchant", "name")
        .lean(),
      Proof.countDocuments(query),
    ]);

    return {
      proofs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get donor proof timeline
   * @param {string} donorId - Donor user ID
   * @returns {Promise<Array>} Timeline grouped by campaign
   */
  async getDonorProofTimeline(donorId) {
    // 1. Find all campaigns the donor has donated to
    const donations = await Donation.find({ donor: donorId })
      .select("campaign amount createdAt")
      .populate("campaign", "title")
      .lean();

    if (donations.length === 0) {
      return { campaigns: [] };
    }

    const campaignIds = donations.map((d) => d.campaign._id);

    // 2. Find all verified proofs for those campaigns
    const proofs = await Proof.find({
      campaign: { $in: campaignIds },
      status: { $in: [PROOF_STATUS.AI_VERIFIED, PROOF_STATUS.APPROVED] },
    })
      .sort({ capturedAt: -1 })
      .lean();

    // 3. Group proofs by campaign
    const campaignMap = new Map();
    donations.forEach((donation) => {
      const campaignId = donation.campaign._id.toString();
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          campaignId: donation.campaign._id,
          campaignTitle: donation.campaign.title,
          donationAmount: donation.amount,
          donationDate: donation.createdAt,
          proofs: [],
        });
      }
    });

    proofs.forEach((proof) => {
      const campaignId = proof.campaign.toString();
      if (campaignMap.has(campaignId)) {
        campaignMap.get(campaignId).proofs.push({
          proofId: proof._id,
          proofType: proof.proofType,
          files: proof.files.map((f) => ({
            fileUrl: f.fileUrl,
            fileType: f.fileType,
          })),
          capturedAt: proof.capturedAt,
          aiValidation: {
            confidenceScore: proof.aiValidation.confidenceScore,
          },
        });
      }
    });

    // 4. Add proof count and sort by most recent proof
    const campaigns = Array.from(campaignMap.values())
      .map((campaign) => ({
        ...campaign,
        proofCount: campaign.proofs.length,
      }))
      .sort((a, b) => {
        const aLatest = a.proofs[0]?.capturedAt || new Date(0);
        const bLatest = b.proofs[0]?.capturedAt || new Date(0);
        return bLatest - aLatest;
      });

    return { campaigns };
  }

  /**
   * Verify proof hash
   * @param {string} proofId - Proof ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyProofHash(proofId) {
    const proof = await Proof.findById(proofId).lean();
    if (!proof) {
      throw new AppError(PROOF_ERROR_MESSAGES.PROOF_NOT_FOUND, 404);
    }

    const storedHash = proof.hash;
    const blockchainTxHash = proof.hash; // Assuming hash field stores blockchain tx hash after anchoring

    // Compute current hash from stored file
    try {
      const fileBuffer = await fileStorageService.getFile(
        proof.files[0].fileUrl,
      );
      const currentHash = fileStorageService.computeFileHash(fileBuffer);

      const verificationStatus =
        currentHash === proof.files[0].checksum ? "VALID" : "TAMPERED";

      return {
        proofId: proof._id,
        storedHash: proof.files[0].checksum,
        currentHash,
        blockchainTxHash,
        verificationStatus,
        anchoredAt: proof.updatedAt,
      };
    } catch (error) {
      logger.error({
        type: "PROOF_VERIFICATION_ERROR",
        proofId,
        error: error.message,
      });
      throw new AppError("Failed to verify proof hash", 500);
    }
  }

  /**
   * Submit manual review for flagged proof
   * @param {string} proofId - Proof ID
   * @param {string} decision - APPROVED or REJECTED
   * @param {string} reason - Optional reason
   * @param {string} reviewerId - Reviewer user ID
   * @returns {Promise<Object>} Updated proof
   */
  async submitManualReview(proofId, decision, reason, reviewerId) {
    const proof = await Proof.findById(proofId).populate("campaign");
    if (!proof) {
      throw new AppError(PROOF_ERROR_MESSAGES.PROOF_NOT_FOUND, 404);
    }

    if (proof.status !== PROOF_STATUS.FLAGGED) {
      throw new AppError(PROOF_ERROR_MESSAGES.MANUAL_REVIEW_REQUIRED, 400);
    }

    if (
      ![
        MANUAL_REVIEW_DECISION.APPROVED,
        MANUAL_REVIEW_DECISION.REJECTED,
      ].includes(decision)
    ) {
      throw new AppError(PROOF_ERROR_MESSAGES.INVALID_DECISION, 400);
    }

    const oldStatus = proof.status;

    // Update manual review fields
    proof.manualReview = {
      reviewedBy: reviewerId,
      decision,
      reason,
      reviewedAt: new Date(),
    };

    // Update status
    proof.status =
      decision === MANUAL_REVIEW_DECISION.APPROVED
        ? PROOF_STATUS.APPROVED
        : PROOF_STATUS.REJECTED;

    await proof.save();

    // Create audit log
    await createAuditLog({
      eventType: PROOF_AUDIT_EVENTS.PROOF_MANUALLY_REVIEWED,
      actorId: reviewerId,
      actorRole: "GOVERNMENT",
      entityType: "Proof",
      entityId: proof._id,
      campaignId: proof.campaign._id,
      payload: {
        oldStatus,
        newStatus: proof.status,
        decision,
        reason,
      },
    });

    // Send notifications
    if (decision === MANUAL_REVIEW_DECISION.APPROVED) {
      // Queue blockchain anchoring
      await blockchainQueue.add(
        "proof-blockchain-anchor",
        {
          proofId: proof._id.toString(),
          hash: proof.hash,
          campaignId: proof.campaign._id.toString(),
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        },
      );

      await this.notifyDonorsOfVerifiedProof(proof);

      // Update trust scores for campaign and NGO
      try {
        await Promise.all([
          trustService.updateTrustScore(
            proof.campaign._id,
            "CAMPAIGN",
            "Proof approved by manual review",
            "PROOF_VERIFIED",
            reviewerId,
          ),
          trustService.updateTrustScore(
            proof.campaign.createdBy,
            "NGO",
            "Proof approved by manual review",
            "PROOF_VERIFIED",
            reviewerId,
          ),
        ]);
      } catch (trustError) {
        logger.error({
          type: "TRUST_UPDATE_ERROR",
          proofId: proof._id,
          error: trustError.message,
        });
      }
    } else {
      await createNotification({
        userId: proof.campaign.ngo,
        role: "NGO",
        type: PROOF_NOTIFICATION_TYPES.PROOF_REJECTED,
        title: "Proof Rejected",
        message: `Proof rejected for campaign ${proof.campaign.title}. Reason: ${reason || "Manual review"}`,
        entityType: "Proof",
        entityId: proof._id.toString(),
        channels: ["IN_APP", "EMAIL"],
        priority: "HIGH",
      });

      // Update trust scores for campaign and NGO (negative impact)
      try {
        await Promise.all([
          trustService.updateTrustScore(
            proof.campaign._id,
            "CAMPAIGN",
            "Proof rejected by manual review",
            "PROOF_REJECTED",
            reviewerId,
          ),
          trustService.updateTrustScore(
            proof.campaign.createdBy,
            "NGO",
            "Proof rejected by manual review",
            "PROOF_REJECTED",
            reviewerId,
          ),
        ]);
      } catch (trustError) {
        logger.error({
          type: "TRUST_UPDATE_ERROR",
          proofId: proof._id,
          error: trustError.message,
        });
      }
    }

    logger.info({
      type: "PROOF_MANUALLY_REVIEWED",
      proofId: proof._id,
      decision,
      reviewerId,
    });

    return proof;
  }

  /**
   * Notify donors of verified proof
   * @param {Object} proof - Proof document
   * @private
   */
  async notifyDonorsOfVerifiedProof(proof) {
    try {
      // Find all donors who donated to this campaign
      const donations = await Donation.find({ campaign: proof.campaign._id })
        .select("donor")
        .lean();

      const donorIds = [...new Set(donations.map((d) => d.donor.toString()))];

      // Create notifications for each donor
      const notifications = donorIds.map((donorId) => ({
        userId: donorId,
        role: "DONOR",
        type: PROOF_NOTIFICATION_TYPES.PROOF_VERIFIED,
        title: "Proof Verified",
        message: `New proof verified for campaign ${proof.campaign.title}`,
        entityType: "Proof",
        entityId: proof._id.toString(),
        channels: ["IN_APP"],
        priority: "NORMAL",
      }));

      await Promise.all(notifications.map((n) => createNotification(n)));

      logger.info({
        type: "DONORS_NOTIFIED_OF_VERIFIED_PROOF",
        proofId: proof._id,
        donorCount: donorIds.length,
      });
    } catch (error) {
      logger.error({
        type: "DONOR_NOTIFICATION_ERROR",
        proofId: proof._id,
        error: error.message,
      });
      // Don't throw - notification failure shouldn't block proof verification
    }
  }

  /**
   * Check idempotency key
   * @param {string} key - Idempotency key
   * @returns {Promise<Object|null>} Existing proof or null
   * @private
   */
  async checkIdempotency(key) {
    const idempotencyRecord = await IdempotencyKey.findOne({
      key,
      resourceType: "Proof",
    }).lean();

    if (idempotencyRecord) {
      return await Proof.findById(idempotencyRecord.resourceId).lean();
    }

    return null;
  }

  /**
   * Store idempotency key
   * @param {string} key - Idempotency key
   * @param {string} proofId - Proof ID
   * @private
   */
  async storeIdempotency(key, proofId) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await IdempotencyKey.create({
      key,
      resourceType: "Proof",
      resourceId: proofId,
      expiresAt,
    });
  }

  /**
   * Detect file type from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File type
   * @private
   */
  detectFileType(mimeType) {
    if (mimeType.startsWith("image/")) return "IMAGE";
    if (mimeType.startsWith("video/")) return "VIDEO";
    if (mimeType === "application/pdf") return "PDF";
    return "DOCUMENT";
  }
}

export default new ProofService();
