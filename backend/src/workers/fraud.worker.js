import crypto from "crypto";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.config.js";
import aiService from "../infrastructure/ai/ai.service.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import workflowEngine from "../engines/workflow.engine.js";
import trustService from "../modules/trust/trust.service.js";
import { Wallet } from "../models/wallet/Wallet.model.js";
import { FraudAlert } from "../models/governance/FraudAlert.model.js";
import { FraudCase } from "../models/FraudCase.model.js";
import {
  WALLET_STATUS,
  AUDIT_EVENT_TYPES,
} from "../modules/wallet/wallet.constants.js";
import { createNotification } from "../modules/notification/notification.service.js";
import { Beneficiary } from "../models/beneficiary/Beneficiary.model.js";

// Builds a FraudAlert document that actually matches the schema. The two
// call sites below used to pass entityType: "Wallet" (schema requires
// uppercase "WALLET"), and top-level reason/riskScore/signals/detectedAt
// fields that don't exist on the schema at all (they live under
// aiDetection.* / metadata.*) - and never set the two *required* fields,
// alertId and alertType. Every previous call threw a ValidationError,
// silently swallowed by this worker's outer try/catch, so no fraud alert
// had ever actually been persisted, and (for the auto-freeze branch) the
// throw happened before wallet.save() ran, so the freeze itself silently
// never took effect either.
const buildFraudAlertData = ({
  wallet,
  alertType,
  severity,
  reason,
  signals,
}) => ({
  alertId: `FA-${crypto.randomUUID()}`,
  entityType: "WALLET",
  entityId: wallet._id.toString(),
  campaign: wallet.campaign || null,
  alertType,
  severity,
  aiDetection: {
    riskScore: wallet.riskScore,
    signals: Object.entries(signals || {}).map(
      ([key, value]) => `${key}: ${value}`,
    ),
  },
  metadata: { reason, rawSignals: signals },
});

// FraudCase is the model backing the admin investigation workflow
// (assign / add notes / resolve) - a completely separate collection from
// FraudAlert above. Both records describe the same detected event; each
// feeds a different, otherwise-disconnected part of the product (FraudAlert
// -> public/government/NGO dashboards + trust scoring, FraudCase -> the
// admin Fraud Management investigation screen).
const buildFraudCaseData = ({ wallet, severity, reason, signals }) => ({
  entityType: "WALLET",
  entityId: wallet._id.toString(),
  riskScore: wallet.riskScore,
  reason,
  status: "OPEN",
  relatedCampaign: wallet.campaign || null,
  aiMetadata: {
    modelVersion: "risk_agent-v1",
    confidence: wallet.riskScore,
    signals: Object.entries(signals || {}).map(
      ([key, value]) => `${key}: ${value}`,
    ),
  },
});

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
            await FraudAlert.create(
              buildFraudAlertData({
                wallet,
                alertType: "WALLET_ABUSE",
                severity: "HIGH",
                reason: result.reason || "High risk score detected",
                signals,
              }),
            );
            await FraudCase.create(
              buildFraudCaseData({
                wallet,
                severity: "HIGH",
                reason: result.reason || "High risk score detected",
                signals,
              }),
            );

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
                await createNotification({
                  userId: beneficiary.user,
                  role: "BENEFICIARY",
                  type: "WALLET_FROZEN",
                  title: "Wallet Frozen",
                  message: `Your wallet has been frozen due to: ${wallet.freezeReason}`,
                  entityType: "Wallet",
                  entityId: wallet._id,
                  priority: "HIGH",
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
            await FraudAlert.create(
              buildFraudAlertData({
                wallet,
                alertType: "AI_ANOMALY",
                severity: "MEDIUM",
                reason: result.reason || "Suspicious activity requires review",
                signals,
              }),
            );
            await FraudCase.create(
              buildFraudCaseData({
                wallet,
                severity: "MEDIUM",
                reason: result.reason || "Suspicious activity requires review",
                signals,
              }),
            );
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
