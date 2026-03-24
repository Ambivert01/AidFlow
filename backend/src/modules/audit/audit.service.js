import { AuditLog } from "../../models/AuditLog.model.js";

import { BaseService } from "../../core/base.service.js";

export const createAuditLog = async (data) => {
  const log = await AuditLog.create({
    eventType: data.eventType,

    entityId: data.entityId,

    jobIdHash: data.jobIdHash,

    sequence: data.sequence,

    campaignId: data.campaignId,

    actorRole: data.actorRole,

    payload: data.payload,

    previousHash: data.previousHash,

    hash: data.hash,
  });

  return log;
};

export const getCampaignAuditTrail = async (campaignId) => {
  const logs = await AuditLog.find({
    campaignId,
  }).sort({ createdAt: 1 });

  return BaseService.success(logs);
};

export const getEntityAuditTrail = async (entityId) => {
  const logs = await AuditLog.find({
    entityId,
  });

  return BaseService.success(logs);
};

export const finalizeAuditWorkflow = async (jobIdHash) => {
  const logs = await AuditLog.find({
    jobIdHash,
  });

  // future: generate merkle root

  return BaseService.success({
    workflowId: jobIdHash,

    logsCount: logs.length,
  });
};

export const searchAudit = async(query)=>{

 return AuditLog.find({

  actorRole:query.role,
  eventType:query.event

 });

};