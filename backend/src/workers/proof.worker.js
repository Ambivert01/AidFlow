import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import proofService from "../modules/proof/proof.service.js";
import blockchainAudit from "../infrastructure/blockchain/audit.service.js";
import auditService from "../modules/audit/audit.service.js";
import { AI_PROOF_URL } from "../config/env.config.js";
import {
  PROOF_STATUS,
  PROOF_AUDIT_EVENTS,
} from "../modules/proof/proof.constants.js";
import { Proof } from "../models/proofs/Proof.model.js";
import logger from "../utils/logger.js";

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
          proof_id: proofId,
          file_urls: fileUrls,
          proof_type: proofType,
          campaign_id: campaignId,
          location,
          captured_at: capturedAt,
          campaign_location: campaignLocation,
          campaign_period: campaignPeriod,
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
        confidenceScore: aiResult.confidence_score,
        fraudProbability: aiResult.fraud_probability,
      });

      // Update proof with AI results
      await proofService.updateProofFromAI(proofId, {
        decision: aiResult.decision,
        confidenceScore: aiResult.confidence_score,
        fraudProbability: aiResult.fraud_probability,
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
    const { proofId, hash, campaignId } = job.data;

    // Check if this is a proof anchoring job (has proofId)
    if (!proofId) {
      // This is a legacy batch anchoring job - let the old worker handle it
      const result = await blockchainAudit.anchorRoot();
      if (!result) return;

      await auditService.log({
        eventType: "BLOCKCHAIN_ANCHORED",
        actor: "SYSTEM",
        resource: "Proof",
        resourceId: job.id.toString(),
        payload: {
          merkleRoot: result.root,
          txHash: result.txHash,
        },
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
          await auditService.log({
            eventType: PROOF_AUDIT_EVENTS.PROOF_ANCHORED,
            actor: "SYSTEM",
            resource: "Proof",
            resourceId: proofId,
            payload: {
              merkleRoot: result.root,
              txHash: result.txHash,
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
