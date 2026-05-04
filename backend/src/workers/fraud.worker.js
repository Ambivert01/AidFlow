import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import aiService from "../infrastructure/ai/ai.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import workflowEngine from "../engines/workflow.engine.js";
import trustService from "../modules/trust/trust.service.js";
import { Wallet } from "../models/wallet/Wallet.model.js";
import { FraudAlert } from "../models/governance/FraudAlert.model.js";
import {
  WALLET_STATUS,
  AUDIT_EVENT_TYPES,
} from "../modules/wallet/wallet.constants.js";
import { sendNotification } from "../modules/notification/notification.service.js";
import { Beneficiary } from "../models/beneficiary/Beneficiary.model.js";

new Worker(
  "fraud-detection",
  async (job) => {
    const { entityType, entityId, signals } = job.data;

    try {
      // Call AI fraud detection service
      const result = await aiService.evaluateFraudProbability({
        type: entityType,
        signals,
      });

      // Handle wallet-specific fraud detection
      if (entityType === "wallet") {
        const wallet = await Wallet.findById(entityId);

        if (!wallet) {
          console.error(`Wallet not found: ${entityId}`);
          return result;
        }

        // Determine risk increment based on fraud decision
        let riskIncrement = 0;
        let flagType = null;

        if (result.decision === "BLOCK") {
          riskIncrement = 20;
          flagType = result.reason || "SUSPICIOUS_PATTERN";
        } else if (result.decision === "ESCALATE") {
          riskIncrement = 10;
          flagType = result.reason || "REQUIRES_REVIEW";
        }

        // Update wallet risk score and fraud flags
        if (riskIncrement > 0) {
          wallet.riskScore = Math.min(100, wallet.riskScore + riskIncrement);

          if (flagType && !wallet.fraudFlags.includes(flagType)) {
            wallet.fraudFlags.push(flagType);
          }

          // Auto-freeze wallet if risk score exceeds 90
          if (wallet.riskScore > 90 && wallet.status === WALLET_STATUS.ACTIVE) {
            wallet.status = WALLET_STATUS.SUSPENDED;
            wallet.freezeReason = "Automatic freeze due to high risk score";
            wallet.frozenAt = new Date();

            // Create fraud alert
            await FraudAlert.create({
              entityType: "Wallet",
              entityId: wallet._id,
              severity: "HIGH",
              reason: result.reason || "High risk score detected",
              riskScore: wallet.riskScore,
              signals,
              detectedAt: new Date(),
            });

            // Update trust scores for campaign and NGO
            try {
              await Promise.all([
                trustService.updateTrustScore(
                  wallet.campaign,
                  "CAMPAIGN",
                  "Fraud detected in wallet",
                  "FRAUD_DETECTED",
                  null,
                ),
              ]);
            } catch (trustError) {
              console.error("Failed to update trust score:", trustError);
            }

            // Send notification to beneficiary
            try {
              const beneficiary = await Beneficiary.findById(
                wallet.beneficiary,
              );
              if (beneficiary) {
                await sendNotification({
                  userId: beneficiary.user,
                  type: "WALLET_FROZEN",
                  data: {
                    walletId: wallet._id,
                    reason: wallet.freezeReason,
                  },
                });
              }
            } catch (error) {
              console.error("Failed to send fraud freeze notification:", error);
            }

            // Create audit log for auto-freeze
            await createAuditLog({
              eventType: AUDIT_EVENT_TYPES.WALLET_FROZEN,
              entityType: "Wallet",
              entityId: wallet._id,
              actorRole: "SYSTEM",
              payload: {
                reason: wallet.freezeReason,
                riskScore: wallet.riskScore,
                autoFreeze: true,
              },
            });
          }

          // Create fraud alert for ESCALATE decisions
          if (result.decision === "ESCALATE") {
            await FraudAlert.create({
              entityType: "Wallet",
              entityId: wallet._id,
              severity: "MEDIUM",
              reason: result.reason || "Suspicious activity requires review",
              riskScore: wallet.riskScore,
              signals,
              detectedAt: new Date(),
            });
          }

          await wallet.save();
        }
      }

      // Legacy fraud detection for high risk scores
      if (result.riskScore > 85) {
        await workflowEngine.handleFraudDetected({
          entityType,
          entityId,
          riskScore: result.riskScore,
        });

        await createAuditLog({
          eventType: "FRAUD_DETECTED",
          eventCategory: "SECURITY",
          entityType: entityType || "User",
          entityId: String(entityId),
          jobIdHash: job.id.toString(),
          actorRole: "AI",
          payload: {
            riskScore: result.riskScore,
            signals,
          },
        });
      }

      return result;
    } catch (error) {
      console.error("Fraud detection worker error:", error);
      // Fail-open: don't throw error to prevent transaction rollback
      return { decision: "ALLOW", reason: "SERVICE_ERROR", riskScore: 0 };
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
);

console.log("Fraud detection worker started");
