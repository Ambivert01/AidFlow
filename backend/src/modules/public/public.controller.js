import { asyncHandler } from "../../core/asyncHandler.js";
import * as publicService from "./public.service.js";

/**
 * Get public homepage statistics
 * GET /api/public/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const result = await publicService.getPublicStats();
  res.json(result);
});

/**
 * Get public campaigns
 * GET /api/public/campaigns
 */
export const getCampaigns = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const result = await publicService.getPublicCampaigns(limit);
  res.json(result);
});

/**
 * Get recent public transactions
 * GET /api/public/recent-transactions
 */
export const getRecentTransactions = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const result = await publicService.getRecentTransactions(limit);
  res.json(result);
});

/**
 * Get blockchain status
 * GET /api/public/blockchain-status
 */
export const getBlockchainStatus = asyncHandler(async (req, res) => {
  const result = await publicService.getBlockchainStatus();
  res.json(result);
});

/**
 * Get campaign by ID (public view)
 * GET /api/public/campaigns/:id
 */
export const getCampaignById = asyncHandler(async (req, res) => {
  const result = await publicService.getPublicCampaignById(req.params.id);
  res.json(result);
});
