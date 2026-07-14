import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import proofService from "../modules/proof/proof.service.js";
import blockchainAudit from "../infrastructure/blockchain/audit.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import { AI_PROOF_URL } from "../config/env.config.js";
import {
  PROOF_STATUS,
  PROOF_AUDIT_EVENTS,
} from "../modules/proof/proof.constants.js";
import { Proof } from "../models/proofs/Proof.model.js";
import { Donation } from "../models/donor/Donation.model.js";
import { logger } from "../utils/logger.js";

/**
 * Proof validation worker
 * Processes proof-validation queue jobs and calls AI validation agent
 */
new Worker(
  "proof-validation",
  async (job) => {
    const {
      proofId,
      fileUrls,
      proofType,
      campaignId,
      merchantId,
      expectedAmount,
      location,
      capturedAt,
      campaignLocation,
      campaignPeriod,
    } = job.data;

    logger.info({
      type: "PROOF_VALIDATION_STARTED",
      proofId,
      jobId: job.id,
    });

    try {
      // Call AI validation agent
      const response = await fetch(`${AI_PROOF_URL}/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofId: proofId,
          fileUrls: fileUrls,
          proofType: proofType,
          campaignId: campaignId,
          merchantId: merchantId,
          expectedAmount: expectedAmount,
          location,
          capturedAt: capturedAt,
          campaignLocation: campaignLocation,
          campaignPeriod: campaignPeriod,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `AI agent returned status ${response.status}: ${response.statusText}`,
        );
      }

      const aiResult = await response.json();

      logger.info({
        type: "AI_VALIDATION_RESPONSE",
        proofId,
        decision: aiResult.decision,
        confidenceScore: aiResult.confidenceScore,
        fraudProbability: aiResult.fraudProbability,
      });

      // Update proof with AI results
      await proofService.updateProofFromAI(proofId, {
        decision: aiResult.decision,
        confidenceScore: aiResult.confidenceScore,
        fraudProbability: aiResult.fraudProbability,
        flags: aiResult.flags || [],
      });

      return {
        success: true,
        proofId,
        decision: aiResult.decision,
      };
    } catch (error) {
      logger.error({
        type: "PROOF_VALIDATION_ERROR",
        proofId,
        error: error.message,
        stack: error.stack,
      });

      // Handle AI agent unavailability - flag proof for manual review
      try {
        const proof = await Proof.findById(proofId);
        if (proof && proof.status === PROOF_STATUS.UNDER_VALIDATION) {
          proof.status = PROOF_STATUS.FLAGGED;
          proof.aiValidation = {
            verified: false,
            confidenceScore: 0,
            fraudProbability: 0,
            flags: ["AI_SERVICE_UNAVAILABLE"],
            evaluatedAt: new Date(),
          };
          await proof.save();

          logger.warn({
            type: "PROOF_FLAGGED_DUE_TO_AI_ERROR",
            proofId,
            reason: "AI service unavailable",
          });
        }
      } catch (fallbackError) {
        logger.error({
          type: "PROOF_FALLBACK_ERROR",
          proofId,
          error: fallbackError.message,
        });
      }

      // Re-throw to trigger retry
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  },
);

logger.info({ type: "WORKER_STARTED", worker: "proof-validation" });

/**
 * Blockchain anchoring worker for proofs
 * Processes blockchain-anchor queue jobs for verified proofs
 */
new Worker(
  "blockchain-anchor",
  async (job) => {
    const { proofId, hash, campaignId, type, entityId, data } = job.data;

    // Donation anchoring (the only real caller of addBlockchainJob today
    // sends {type: "DONATION", entityId, data}). This used to silently fall
    // into the generic legacy-batch branch below - which anchors a batch
    // root fine, but writes the result nowhere near the actual donation, so
    // Donation.blockchainHash/blockchainAnchored (the fields the
    // donor-facing "verify on blockchain" screen reads) never got set.
    if (type === "DONATION" && entityId) {
      try {
        const eventHash = await blockchainAudit.recordAuditEvent({
          type: "DONATION",
          donationId: entityId,
          ...data,
        });

        const result = await blockchainAudit.anchorRoot(
          entityId,
          data?.campaignId || "",
        );

        const update = result
          ? {
              blockchainHash: result.txHash,
              blockchainAnchored: true,
              blockchainAnchoredAt: new Date(),
            }
          : {
              // Blockchain temporarily unavailable - keep the computed
              // event hash so it's visible, but don't claim it's anchored.
              blockchainHash: eventHash,
              blockchainAnchored: false,
            };

        await Donation.findByIdAndUpdate(entityId, update);

        await createAuditLog({
          eventType: "BLOCKCHAIN_ANCHORED",
          actorRole: "SYSTEM",
          entityType: "Donation",
          entityId,
          payload: result
            ? { merkleRoot: result.root, txHash: result.txHash }
            : { blockchainUnavailable: true, eventHash },
          merkleRoot: result?.root,
          blockchainAnchor: result
            ? { txHash: result.txHash, anchoredAt: new Date() }
            : undefined,
        });

        logger.info({
          type: "DONATION_BLOCKCHAIN_ANCHORED",
          entityId,
          anchored: Boolean(result),
        });

        return { success: true, entityId, anchored: Boolean(result) };
      } catch (error) {
        logger.error({
          type: "DONATION_BLOCKCHAIN_ANCHOR_ERROR",
          entityId,
          error: error.message,
        });
        // Graceful degradation - donation stays valid even if anchoring
        // failed, matching the same "never block on blockchain" policy the
        // proof-anchoring branch below already follows.
        return { success: true, entityId, blockchainError: error.message };
      }
    }

    // Check if this is a proof anchoring job (has proofId)
    if (!proofId) {
      // This is a legacy batch anchoring job - let the old worker handle it
      const result = await blockchainAudit.anchorRoot();
      if (!result) return;

      await createAuditLog({
        eventType: "BLOCKCHAIN_ANCHORED",
        actorRole: "SYSTEM",
        entityType: "Proof",
        entityId: job.id.toString(),
        payload: {
          merkleRoot: result.root,
          txHash: result.txHash,
        },
        merkleRoot: result.root,
        blockchainAnchor: { txHash: result.txHash, anchoredAt: new Date() },
      });

      return result;
    }

    logger.info({
      type: "PROOF_BLOCKCHAIN_ANCHOR_STARTED",
      proofId,
      jobId: job.id,
    });

    try {
      // Append proof hash to merkle tree
      await blockchainAudit.recordAuditEvent({
        type: "PROOF_VERIFIED",
        proofId,
        hash,
        campaignId,
        timestamp: new Date().toISOString(),
      });

      // Anchor to blockchain
      const result = await blockchainAudit.anchorRoot(proofId, campaignId);

      if (result) {
        // Update proof with blockchain transaction hash
        const proof = await Proof.findById(proofId);
        if (proof) {
          proof.blockchainTxHash = result.txHash;
          await proof.save();

          // Create audit log
          await createAuditLog({
            eventType: PROOF_AUDIT_EVENTS.PROOF_ANCHORED,
            actorRole: "SYSTEM",
            entityType: "Proof",
            entityId: proofId,
            payload: {
              merkleRoot: result.root,
              txHash: result.txHash,
            },
            merkleRoot: result.root,
            blockchainAnchor: {
              txHash: result.txHash,
              anchoredAt: new Date(),
            },
          });

          logger.info({
            type: "PROOF_BLOCKCHAIN_ANCHORED",
            proofId,
            txHash: result.txHash,
          });
        }

        return {
          success: true,
          proofId,
          txHash: result.txHash,
        };
      } else {
        // Blockchain unavailable - graceful degradation
        logger.warn({
          type: "PROOF_BLOCKCHAIN_UNAVAILABLE",
          proofId,
          message: "Proof remains verified without blockchain anchor",
        });

        return {
          success: true,
          proofId,
          blockchainUnavailable: true,
        };
      }
    } catch (error) {
      logger.error({
        type: "PROOF_BLOCKCHAIN_ANCHOR_ERROR",
        proofId,
        error: error.message,
        stack: error.stack,
      });

      // Don't throw - graceful degradation
      // Proof remains verified even if blockchain anchoring fails
      return {
        success: true,
        proofId,
        blockchainError: error.message,
      };
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Sequential processing for blockchain
  },
);

logger.info({ type: "WORKER_STARTED", worker: "proof-blockchain-anchor" });
