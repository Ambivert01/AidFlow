import crypto from "crypto";
import { AuditLog } from "../../models/audit/AuditLog.model.js";

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

    aiMetadata: {
      decision: data.aiDecision || null,

      riskScore: data.riskScore || null,

      flags: data.flags || [],
    },

    previousHash: await getPreviousHash(jobIdHash),

    metadata: data.metadata || {},
  };

  logPayload.hash = generateHash(logPayload);

  return AuditLog.create(logPayload, { session });
};

/*
 HELPERS
*/

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
