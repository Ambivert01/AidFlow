import { asyncHandler } from "../../core/asyncHandler.js";
import * as adminService from "./admin.service.js";

export const getStats = asyncHandler(async (req, res) => {
  const result = await adminService.getAdminStats();
  res.json(result);
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const result = await adminService.getPendingRequests();
  res.json(result);
});

export const approveUser = asyncHandler(async (req, res) => {
  const result = await adminService.approveUser(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.json(result);
});

export const rejectUser = asyncHandler(async (req, res) => {
  const result = await adminService.rejectUser(
    req.params.id,
    req.user._id,
    req.body.reason,
  );
  res.json(result);
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  res.json(result);
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const result = await adminService.toggleUserActive(req.params.id);
  res.json(result);
});

export const getAllMerchants = asyncHandler(async (req, res) => {
  const result = await adminService.getAllMerchants(req.query);
  res.json(result);
});

export const updateMerchant = asyncHandler(async (req, res) => {
  const result = await adminService.updateMerchant(req.params.id, req.body);
  res.json(result);
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await adminService.getAuditLogs(req.query);
  res.json(result);
});

export const freezeWallet = asyncHandler(async (req, res) => {
  const result = await adminService.freezeWallet(
    req.params.id,
    req.body.reason,
    req.user._id,
  );
  res.json(result);
});

export const banMerchant = asyncHandler(async (req, res) => {
  const result = await adminService.banMerchant(req.params.id, req.body.reason);
  res.json(result);
});

export const getFraudAlerts = asyncHandler(async (req, res) => {
  const result = await adminService.getFraudAlerts();
  res.json(result);
});

export const getPendingCampaigns = asyncHandler(async (req, res) => {
  const result = await adminService.getPendingCampaigns();
  res.json(result);
});

export const approveCampaign = asyncHandler(async (req, res) => {
  const result = await adminService.approveCampaign(
    req.params.id,
    req.user._id,
  );
  res.json(result);
});

export const rejectCampaign = asyncHandler(async (req, res) => {
  const result = await adminService.rejectCampaign(
    req.params.id,
    req.user._id,
    req.body.reason,
  );
  res.json(result);
});

export const pauseCampaign = asyncHandler(async (req, res) => {
  const { pauseCampaign } = await import("../campaign/campaign.service.js");
  const result = await pauseCampaign(
    req.params.id,
    req.user._id,
    req.body.reason,
  );
  res.status(200).json(result);
});

export const resumeCampaign = asyncHandler(async (req, res) => {
  const { resumeCampaign } = await import("../campaign/campaign.service.js");
  const result = await resumeCampaign(req.params.id, req.user._id);
  res.status(200).json(result);
});

export const overrideAIDecision = asyncHandler(async (req, res) => {
  const result = await adminService.overrideAIDecision(req.body, req.user._id);
  res.json(result);
});

export const bulkApproveUsers = asyncHandler(async (req, res) => {
  const result = await adminService.bulkApproveUsers(
    req.body.userIds,
    req.user._id,
  );
  res.json(result);
});

export const bulkRejectUsers = asyncHandler(async (req, res) => {
  const result = await adminService.bulkRejectUsers(
    req.body.userIds,
    req.user._id,
    req.body.reason,
  );
  res.json(result);
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const result = await adminService.getSystemHealth();
  res.json(result);
});

export const getBlockchainAnchors = asyncHandler(async (req, res) => {
  const result = await adminService.getBlockchainAnchors(req.query);
  res.json(result);
});
