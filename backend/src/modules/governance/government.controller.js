import { asyncHandler } from "../../core/asyncHandler.js";
import * as govService from "./government.service.js";

export const getOverview = asyncHandler(async (req, res) => {
  const result = await govService.getOverview();
  res.json(result);
});

export const getEscalated = asyncHandler(async (req, res) => {
  const result = await govService.getEscalatedDonations();
  res.json(result);
});

export const approveDonation = asyncHandler(async (req, res) => {
  const result = await govService.approveDonation(req.params.id, req.user._id);
  res.json(result);
});

export const rejectDonation = asyncHandler(async (req, res) => {
  const result = await govService.rejectDonation(req.params.id, req.user._id, req.body.reason);
  res.json(result);
});

export const getWallets = asyncHandler(async (req, res) => {
  const result = await govService.getWallets(req.query);
  res.json(result);
});

export const freezeWallet = asyncHandler(async (req, res) => {
  const result = await govService.freezeWallet(req.body.walletId, req.body.reason, req.user._id);
  res.json(result);
});

export const unfreezeWallet = asyncHandler(async (req, res) => {
  const result = await govService.unfreezeWallet(req.body.walletId, req.user._id);
  res.json(result);
});

export const getCampaigns = asyncHandler(async (req, res) => {
  const result = await govService.getCampaigns(req.query);
  res.json(result);
});

export const pauseCampaign = asyncHandler(async (req, res) => {
  const result = await govService.pauseCampaign(req.params.id, req.body.reason, req.user._id);
  res.json(result);
});

export const closeCampaign = asyncHandler(async (req, res) => {
  const result = await govService.closeCampaign(req.params.id, req.body.reason, req.user._id);
  res.json(result);
});

export const getFraudAlerts = asyncHandler(async (req, res) => {
  const result = await govService.getFraudAlerts();
  res.json(result);
});

export const reviewDonation = asyncHandler(async (req, res) => {
  const result = await govService.reviewHighRiskDonation(req.params.id, req.body.decision, req.user._id);
  res.json(result);
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const { SystemPolicy } = await import("../../models/SystemPolicy.model.js");
  const policy = await SystemPolicy.findOneAndUpdate({}, req.body, { new: true, upsert: true });
  res.json(policy);
});
