import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import { Donation } from "../models/donor/Donation.model.js";
import { Campaign } from "../models/ngo/Campaign.model.js";
import aiService from "../infrastructure/ai/ai.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import {
  DONATION_STATUS,
  WORKFLOW_STATE,
  AI_DECISION,
} from "../modules/donation/donation.constants.js";
import { addBlockchainJob } from "../jobs/blockchain.job.js";
import { createNotification } from "../modules/notification/notification.service.js";

/**
 * Donation Processing Worker
 * Handles async donation processing with AI risk evaluation and blockchain anchoring
 */
new Worker(
  "donation-processing",
  async (job) => {
    const { donationId, campaignId, amount, donorId } = job.data;

    try {
      console.log(`[DonationWorker] Processing donation ${donationId}`);

      // Step 1: Fetch donation
      const donation = await Donation.findById(donationId);

      if (!donation) {
        console.error(`[DonationWorker] Donation ${donationId} not found`);
        throw new Error("Donation not found");
      }

      // Step 2: Update status to PROCESSING
      donation.status = DONATION_STATUS.PROCESSING;
      donation.workflowState = WORKFLOW_STATE.AI_EVALUATION;
      await donation.save();

      console.log(`[DonationWorker] Donation ${donationId} status: PROCESSING`);

      // Step 3: Call AI Risk Evaluation (fraud agent -> risk agent pipeline)
      // NOTE: A donation's "eligibility" is the donor's authenticated identity
      // (already verified at login) - the real risk signal for a donation is
      // fraud probability, which the risk agent then combines with campaign
      // policy thresholds to produce a final 0-100 score + decision.
      let aiResult;
      try {
        donation.status = DONATION_STATUS.AI_CHECK_PENDING;
        await donation.save();

        const campaign = await Campaign.findById(campaignId).lean();

        const fraudResult = await aiService.evaluateFraudProbability({
          beneficiaryId: donorId,
          walletId: "DONATION",
          deviceFingerprint: job.data.deviceFingerprint || "UNKNOWN",
          location: job.data.location || "",
          recentTransactions: job.data.donorRecentDonationCount || 0,
          totalAidReceived: amount,
          merchantId: "",
          timeWindowHours: 24,
        });

        const riskResult = await aiService.evaluateRisk(
          { eligible: true, confidence: 1.0 },
          fraudResult,
          campaign?.policySnapshot,
        );

        aiResult = {
          decision: riskResult.decision || AI_DECISION.REVIEW,
          riskScore: riskResult.finalRiskScore ?? 10,
          flags: fraudResult.flags || [],
          fraudSignals: [fraudResult.explanation].filter(Boolean),
        };

        console.log(`[DonationWorker] AI evaluation complete:`, {
          decision: aiResult.decision,
          riskScore: aiResult.riskScore,
        });
      } catch (aiError) {
        console.error(`[DonationWorker] AI evaluation failed:`, aiError);

        // Fallback: Default to MANUAL_REVIEW on AI failure
        aiResult = {
          decision: AI_DECISION.REVIEW,
          riskScore: 50,
          flags: ["AI_SERVICE_UNAVAILABLE"],
          fraudSignals: ["AI evaluation failed - manual review required"],
        };
      }

      // Step 4: Store AI decision
      donation.aiDecision = {
        decision: aiResult.decision,
        riskScore: aiResult.riskScore,
        fraudSignals: aiResult.fraudSignals || [],
        fraudFlags: aiResult.flags || [],
        evaluatedAt: new Date(),
        evaluatedBy: "AI",
      };

      // Step 5: Decision Handling - Update status based on AI decision
      // (riskScore is now a 0-100 scale from the risk agent, matching these thresholds)
      if (
        aiResult.decision === "BLOCK"
      ) {
        // Blocked by AI
        donation.status = DONATION_STATUS.REJECTED;
        donation.workflowState = WORKFLOW_STATE.FAILED;
        donation.reviewReason = "Blocked by AI risk evaluation";
        console.log(`[DonationWorker] Blocked by AI`);
      } else if (
        aiResult.decision === "ESCALATE_TO_GOVT" ||
        aiResult.riskScore >= 80
      ) {
        // High risk - escalate to government
        donation.status = DONATION_STATUS.HIGH_RISK_ESCALATED;
        donation.workflowState = WORKFLOW_STATE.GOVT_REVIEW;
        donation.governmentReview.escalated = true;
        console.log(`[DonationWorker] High risk - Government escalation`);
      } else if (
        aiResult.decision === "ALLOW" ||
        aiResult.decision === "ALLOW_WITH_MONITORING" ||
        aiResult.riskScore < 40
      ) {
        // Low risk - proceed to NGO review
        donation.status = DONATION_STATUS.PENDING_NGO_REVIEW;
        donation.workflowState = WORKFLOW_STATE.NGO_REVIEW;
        console.log(`[DonationWorker] Low risk - NGO review`);
      } else {
        // Medium risk or MANUAL_REVIEW - still routed to NGO, but flagged
        donation.status = DONATION_STATUS.PENDING_NGO_REVIEW;
        donation.workflowState = WORKFLOW_STATE.NGO_REVIEW;
        console.log(`[DonationWorker] Manual review required`);
      }

      // Step 6: Save donation
      await donation.save();

      // Step 6b: Let the donor know what happened to their money. Donors
      // previously received zero notifications for their entire donation
      // lifecycle - this was the first point where that visibility existed.
      try {
        const campaignForNotice = await Campaign.findById(campaignId)
          .select("title")
          .lean();
        const campaignTitle = campaignForNotice?.title || "your campaign";

        if (donation.status === DONATION_STATUS.REJECTED) {
          await createNotification({
            userId: donorId,
            role: "DONOR",
            type: "DONATION_REJECTED",
            title: "Donation Blocked",
            message: `Your ₹${amount} donation to "${campaignTitle}" was blocked by our automated risk check and will not be processed.`,
            entityType: "Donation",
            entityId: donation._id.toString(),
            channels: ["IN_APP", "EMAIL"],
            priority: "HIGH",
          });
        } else if (donation.status === DONATION_STATUS.HIGH_RISK_ESCALATED) {
          await createNotification({
            userId: donorId,
            role: "DONOR",
            type: "DONATION_ESCALATED",
            title: "Donation Under Additional Review",
            message: `Your ₹${amount} donation to "${campaignTitle}" was flagged for additional government review before it can be allocated. We'll notify you once it's resolved.`,
            entityType: "Donation",
            entityId: donation._id.toString(),
            channels: ["IN_APP"],
            priority: "NORMAL",
          });
        }
        // PENDING_NGO_REVIEW is the common case and not worth a push
        // notification on its own - the donor sees it as "processing" on
        // their dashboard, and gets notified when the NGO actually acts on
        // it (see ngo.service.js approveDonation/rejectDonation).
      } catch (notifyError) {
        console.error(
          `[DonationWorker] Failed to send donor notification:`,
          notifyError,
        );
      }

      // Step 7: Create audit log for AI decision
      await createAuditLog({
        eventType: "AI_DECISION",
        eventCategory: "DONATION",
        entityId: donation._id.toString(),
        entityType: "Donation",
        campaignId: donation.campaign,
        jobIdHash: donation.jobIdHash,
        actorRole: "AI",
        payload: {
          donationId: donation._id.toString(),
          decision: aiResult.decision,
          riskScore: aiResult.riskScore,
          status: donation.status,
          fraudFlags: aiResult.flags || [],
        },
        metadata: {
          aiEvaluatedAt: donation.aiDecision.evaluatedAt,
        },
      });

      console.log(`[DonationWorker] Audit log created for AI decision`);

      // Step 8: Push blockchain anchoring job (if not blocked)
      if (donation.status !== DONATION_STATUS.REJECTED) {
        try {
          await addBlockchainJob({
            type: "DONATION",
            entityId: donation._id.toString(),
            data: {
              donationId: donation._id.toString(),
              campaignId: donation.campaign.toString(),
              amount: donation.amount,
              status: donation.status,
              riskScore: aiResult.riskScore,
              timestamp: new Date().toISOString(),
            },
          });

          donation.workflowState = WORKFLOW_STATE.BLOCKCHAIN_ANCHORING;
          await donation.save();

          console.log(`[DonationWorker] Blockchain job queued`);
        } catch (blockchainError) {
          console.error(
            `[DonationWorker] Failed to queue blockchain job:`,
            blockchainError,
          );
          // Don't fail the entire job if blockchain queueing fails
        }
      }

      console.log(
        `[DonationWorker] Donation ${donationId} processing complete`,
      );

      return {
        success: true,
        donationId,
        status: donation.status,
        riskScore: aiResult.riskScore,
      };
    } catch (error) {
      console.error(`[DonationWorker] Error processing donation:`, error);

      // Update donation status to FAILED
      try {
        const donation = await Donation.findById(donationId);
        if (donation) {
          donation.status = DONATION_STATUS.FAILED;
          donation.workflowState = WORKFLOW_STATE.FAILED;
          donation.reviewReason = `Processing failed: ${error.message}`;
          await donation.save();

          // Create audit log for failure
          await createAuditLog({
            eventType: "DONATION_PROCESSING_FAILED",
            eventCategory: "DONATION",
            entityId: donation._id.toString(),
            entityType: "Donation",
            campaignId: donation.campaign,
            jobIdHash: donation.jobIdHash,
            actorRole: "SYSTEM",
            payload: {
              donationId: donation._id.toString(),
              error: error.message,
            },
          });
        }
      } catch (updateError) {
        console.error(
          `[DonationWorker] Failed to update donation status:`,
          updateError,
        );
      }

      throw error; // Re-throw to trigger BullMQ retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 donations concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per second
    },
  },
);

console.log("[DonationWorker] Worker started and listening for jobs");
