import { asyncHandler } from "../../core/asyncHandler.js";

import * as auditService from "./audit.service.js";

export const getCampaignAudit = asyncHandler(async (req, res) => {
  const result = await auditService.getCampaignAuditTrail(
    req.params.campaignId,
  );

  res.json(result);
});

export const getEntityAudit = asyncHandler(async (req, res) => {
  const result = await auditService.getEntityAuditTrail(req.params.entityId);

  res.json(result);
});

export const finalizeAudit = asyncHandler(async (req, res) => {
  const result = await auditService.finalizeAuditWorkflow(req.params.jobIdHash);

  res.json(result);
});
