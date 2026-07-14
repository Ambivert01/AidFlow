import crypto from "crypto";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import {
  emitTimelineUpdate,
  emitDonationEvent,
} from "../donation/donation.websocket.service.js";
import { WEBSOCKET_EVENT_TYPE } from "../donation/donation.timeline.constants.js";
import { logger } from "../../utils/logger.js";

let sequenceCache = {};

/*
 CORE AUDIT LOGGER
*/

export const createAuditLog = async (data = {}, session = null) => {
  const jobIdHash = data.jobIdHash || generateWorkflowHash(data);

  const nextSeq = await getNextSequence(jobIdHash);

  const logPayload = {
    eventType: data.eventType || "SYSTEM_EVENT",

    eventCategory: data.eventCategory || detectCategory(data),

    entityId: String(data.entityId || crypto.randomUUID()),

    entityType: data.entityType || detectEntityType(data),

    jobIdHash,

    campaignId: data.campaignId || null,

    sequence: nextSeq,

    workflowStage: data.workflowStage || null,

    actor: {
      userId: data.actorId || null,

      role: data.actorRole || "SYSTEM",

      ipAddress: data.ipAddress || null,

      deviceId: data.deviceId || null,
    },

    payload: data.payload || {},

    // Dedicated blockchain-anchor fields (separate from the generic
    // payload above) - these are what modules/public/public.service.js
    // getBlockchainStatus() queries via "blockchainAnchor.txHash" to show
    // the public "is anchoring operational" status. Previously nothing
    // ever populated these even when payload.txHash was set, so that
    // public status check could never succeed.
    merkleRoot: data.merkleRoot || null,
    blockchainAnchor: data.blockchainAnchor
      ? {
          chain: data.blockchainAnchor.chain || "ETHEREUM",
          txHash: data.blockchainAnchor.txHash || null,
          blockNumber: data.blockchainAnchor.blockNumber || null,
          anchoredAt: data.blockchainAnchor.anchoredAt || new Date(),
        }
      : undefined,

    aiMetadata: {
      decision: data.aiDecision || null,

      riskScore: data.riskScore || null,

      flags: data.flags || [],
    },

    previousHash: await getPreviousHash(jobIdHash),

    metadata: data.metadata || {},
  };

  logPayload.hash = generateHash(logPayload);

  let auditLog;
  if (session) {
    const result = await AuditLog.create([logPayload], { session });
    auditLog = result[0];
  } else {
    auditLog = await AuditLog.create(logPayload);
  }

  // Emit WebSocket event for relevant event types
  await emitWebSocketEventIfNeeded(auditLog, data);

  return auditLog;
};

/*
 HELPERS
*/

/**
 * Emit WebSocket event if the audit log event type is relevant for real-time updates
 * @param {object} auditLog - Created audit log
 * @param {object} data - Original data passed to createAuditLog
 */
async function emitWebSocketEventIfNeeded(auditLog, data) {
  try {
    // Define event types that should trigger WebSocket updates
    const WEBSOCKET_RELEVANT_EVENTS = [
      "PROOF_UPLOADED",
      "PROOF_VERIFIED",
      "PROOF_REJECTED",
      "BLOCKCHAIN_ANCHORED",
      "BLOCKCHAIN_ANCHORING",
      "TRUST_UPDATED",
      "TRUST_SCORE_CHANGED",
      "WALLET_SPENT",
      "WALLET_ALLOCATED",
      "DONATION_APPROVED_BY_NGO",
      "DONATION_REJECTED_BY_NGO",
      "DONATION_APPROVED_BY_GOVT",
      "DONATION_REJECTED_BY_GOVT",
      "BENEFICIARY_ASSIGNED",
      "DONATION_NGO_APPROVED",
      "DONATION_NGO_REJECTED",
      "DONATION_GOVT_APPROVED",
      "DONATION_GOVT_REJECTED",
    ];

    if (!WEBSOCKET_RELEVANT_EVENTS.includes(auditLog.eventType)) {
      return; // Skip non-relevant events
    }

    // Get donation ID from various possible sources
    const donationId =
      data.donationId ||
      data.payload?.donationId ||
      (auditLog.entityType === "Donation" ? auditLog.entityId : null);

    if (!donationId) {
      logger.warn(
        `Cannot emit WebSocket event: missing donationId for event ${auditLog.eventType}`,
      );
      return;
    }

    // Fetch donation to get donor ID
    const { Donation } = await import("../../models/donor/Donation.model.js");
    const donation = await Donation.findById(donationId).select("donor").lean();

    if (!donation || !donation.donor) {
      logger.warn(
        `Cannot emit WebSocket event: donation ${donationId} not found or has no donor`,
      );
      return;
    }

    const donorId = donation.donor.toString();

    // Prepare event data
    const eventData = {
      _id: auditLog._id,
      eventType: auditLog.eventType,
      eventCategory: auditLog.eventCategory,
      timestamp: auditLog.createdAt,
      actor: auditLog.actor,
      payload: auditLog.payload,
      metadata: auditLog.metadata,
      hash: auditLog.hash,
    };

    // Emit timeline update
    emitTimelineUpdate(donorId, donationId, eventData);

    // Emit specific event type if it matches WebSocket event types
    const websocketEventType = WEBSOCKET_EVENT_TYPE[auditLog.eventType];
    if (websocketEventType) {
      emitDonationEvent(donorId, donationId, websocketEventType, eventData);
    }

    logger.info(
      `WebSocket event emitted for ${auditLog.eventType} on donation ${donationId}`,
    );
  } catch (error) {
    // Log error but don't fail the audit log creation
    logger.error("Error emitting WebSocket event:", error);
  }
}

function generateHash(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

function generateWorkflowHash(data) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        entityId: data.entityId,

        timestamp: Date.now(),
      }),
    )
    .digest("hex");
}

async function getNextSequence(jobIdHash) {
  const last = await AuditLog.findOne({ jobIdHash }).sort({ sequence: -1 });

  return last ? last.sequence + 1 : 1;
}

async function getPreviousHash(jobIdHash) {
  const last = await AuditLog.findOne({ jobIdHash }).sort({ sequence: -1 });

  return last ? last.hash : null;
}

function detectCategory(data) {
  const event = data?.eventType || "";

  if (event.includes("DONATION")) return "DONATION";

  if (event.includes("CAMPAIGN")) return "CAMPAIGN";

  if (event.includes("BENEFICIARY")) return "BENEFICIARY";

  if (event.includes("WALLET")) return "WALLET";

  if (event.includes("TRANSACTION")) return "TRANSACTION";

  if (event.includes("PROOF")) return "PROOF";

  if (event.includes("MERCHANT")) return "MERCHANT";

  return "SYSTEM";
}

function detectEntityType(data) {
  if (data?.entityType) return data.entityType;

  const event = data?.eventType || "";

  if (event.includes("DONATION")) return "Donation";

  if (event.includes("CAMPAIGN")) return "Campaign";

  if (event.includes("BENEFICIARY")) return "Beneficiary";

  if (event.includes("WALLET")) return "Wallet";

  if (event.includes("TRANSACTION")) return "Wallet";

  if (event.includes("PROOF")) return "Proof";

  if (event.includes("MERCHANT")) return "Merchant";

  return "User";
}

/*
 EXISTING FUNCTIONS (unchanged)
*/

export const getCampaignAuditTrail = async (campaignId) => {
  const logs = await AuditLog.find({ campaignId }).sort({ sequence: 1 });

  return logs;
};

export const getEntityAuditTrail = async (entityId) => {
  return AuditLog.find({ entityId });
};

export const finalizeAuditWorkflow = async (jobIdHash) => {
  const logs = await AuditLog.find({ jobIdHash });

  return {
    workflowId: jobIdHash,

    logsCount: logs.length,
  };
};

export const searchAudit = async (query) => {
  return AuditLog.find({
    "actor.role": query.role,

    eventType: query.event,
  });
};
