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
  const result = await adminService.approveUser(req.params.id, req.user._id, req.body);
  res.json(result);
});

export const rejectUser = asyncHandler(async (req, res) => {
  const result = await adminService.rejectUser(req.params.id, req.user._id, req.body.reason);
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
  const result = await adminService.freezeWallet(req.params.id, req.body.reason, req.user._id);
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
