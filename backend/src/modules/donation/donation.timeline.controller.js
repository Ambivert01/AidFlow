/**
 * Timeline Controller for Donor Tracking System
 * Handles HTTP requests for timeline endpoints
 */

import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import { AppError } from "../../utils/AppError.js";
import * as timelineService from "./donation.timeline.service.js";
import * as proofService from "./donation.proof.service.js";
import * as blockchainService from "./donation.blockchain.service.js";
import * as trustService from "./donation.trust.service.js";
import * as exportService from "./donation.export.service.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { redisConnection } from "../../config/redis.config.js";
import { createAuditLog } from "../audit/audit.service.js";

/**
 * Get donation timeline
 * GET /api/donations/:id/timeline
 */
export const getDonationTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const options = {
    eventType: req.query.eventType,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    actorRole: req.query.actorRole,
    search: req.query.search,
    page: req.query.page,
    pageSize: req.query.pageSize,
  };

  // Verify donation exists and user has access
  const donation = await Donation.findById(id).select("donor").lean();

  if (!donation) {
    throw new AppError("Donation not found", 404, "DONATION_NOT_FOUND");
  }

  // Check if user is the donor or has appropriate role
  const userId = req.user._id.toString();
  const userRole = req.user.role;

  if (
    donation.donor.toString() !== userId &&
    !["ADMIN", "NGO", "GOVERNMENT"].includes(userRole)
  ) {
    throw new AppError(
      "Unauthorized to view this donation timeline",
      403,
      "UNAUTHORIZED",
    );
  }

  const timeline = await timelineService.getDonationTimeline(id, options);

  return ApiResponse.success(res, timeline, "Timeline retrieved successfully");
});

/**
 * Get proof details
 * GET /api/donations/proofs/:proofId
 */
export const getProofDetails = asyncHandler(async (req, res) => {
  const { proofId } = req.params;

  const proof = await proofService.getProofById(proofId);

  if (!proof) {
    throw new AppError("Proof not found", 404, "PROOF_NOT_FOUND");
  }

  return ApiResponse.success(res, proof, "Proof retrieved successfully");
});

/**
 * Verify blockchain anchor
 * GET /api/donations/:id/blockchain/verify
 */
export const verifyBlockchainAnchor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const donation = await Donation.findById(id)
    .select("blockchainHash blockchainAnchor blockchainAnchoredAt")
    .lean();

  if (!donation) {
    throw new AppError("Donation not found", 404, "DONATION_NOT_FOUND");
  }

  const verification =
    await blockchainService.getBlockchainVerificationSummary(donation);

  return ApiResponse.success(
    res,
    verification,
    "Blockchain verification completed",
  );
});

/**
 * Get trust score history
 * GET /api/donations/:id/trust-history
 */
export const getTrustScoreHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type = "campaign", limit } = req.query;

  // Get donation to find campaign or NGO
  const donation = await Donation.findById(id)
    .select("campaign")
    .populate("campaign", "createdBy")
    .lean();

  if (!donation) {
    throw new AppError("Donation not found", 404, "DONATION_NOT_FOUND");
  }

  let history;

  if (type === "ngo" && donation.campaign?.createdBy) {
    history = await trustService.getNGOTrustHistory(
      donation.campaign.createdBy,
      { limit: parseInt(limit) || 100 },
    );
  } else {
    history = await trustService.getCampaignTrustHistory(
      donation.campaign._id || donation.campaign,
      { limit: parseInt(limit) || 100 },
    );
  }

  // Format for chart display
  const chartData = trustService.formatTrustHistoryForChart(history);

  // Get statistics
  const statistics = trustService.getTrustScoreStatistics(history);

  // Detect significant changes
  const significantChanges = trustService.detectSignificantChanges(history);

  return ApiResponse.success(
    res,
    {
      history,
      chartData,
      statistics,
      significantChanges,
      type,
    },
    "Trust score history retrieved successfully",
  );
});

/**
 * Get timeline cache statistics
 * GET /api/donations/timeline/cache-stats
 */
export const getCacheStatistics = asyncHandler(async (req, res) => {
  // Only allow admins to view cache stats
  if (req.user.role !== "ADMIN") {
    throw new AppError(
      "Unauthorized to view cache statistics",
      403,
      "UNAUTHORIZED",
    );
  }

  const cacheStats = timelineService.getTimelineCacheStats();

  return ApiResponse.success(
    res,
    cacheStats,
    "Cache statistics retrieved successfully",
  );
});

/**
 * Get timeline performance metrics
 * GET /api/donations/timeline/performance-metrics
 */
export const getPerformanceMetrics = asyncHandler(async (req, res) => {
  // Only allow admins to view performance metrics
  if (req.user.role !== "ADMIN") {
    throw new AppError(
      "Unauthorized to view performance metrics",
      403,
      "UNAUTHORIZED",
    );
  }

  const performanceMetrics = timelineService.getTimelinePerformanceMetrics();

  return ApiResponse.success(
    res,
    performanceMetrics,
    "Performance metrics retrieved successfully",
  );
});

/**
 * Get Prometheus metrics
 * GET /api/donations/timeline/metrics
 */
export const getPrometheusMetrics = asyncHandler(async (req, res) => {
  // Only allow admins or monitoring systems to view Prometheus metrics
  if (req.user.role !== "ADMIN") {
    throw new AppError(
      "Unauthorized to view Prometheus metrics",
      403,
      "UNAUTHORIZED",
    );
  }

  const metrics = timelineService.getPrometheusMetrics();

  // Return as plain text for Prometheus scraping
  res.set("Content-Type", "text/plain");
  res.send(metrics);
});

/**
 * Invalidate timeline cache
 * POST /api/donations/:id/timeline/invalidate-cache
 */
export const invalidateTimelineCache = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only allow admins or the donor to invalidate cache
  const donation = await Donation.findById(id).select("donor").lean();

  if (!donation) {
    throw new AppError("Donation not found", 404, "DONATION_NOT_FOUND");
  }

  const userId = req.user._id.toString();
  const userRole = req.user.role;

  if (donation.donor.toString() !== userId && userRole !== "ADMIN") {
    throw new AppError("Unauthorized to invalidate cache", 403, "UNAUTHORIZED");
  }

  const deletedCount = await timelineService.invalidateTimelineCache(id);

  return ApiResponse.success(
    res,
    { deletedCount },
    "Timeline cache invalidated successfully",
  );
});

/**
 * Export timeline to CSV
 * GET /api/donations/:id/timeline/export/csv
 */
export const exportTimelineToCSV = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check rate limit
  const rateLimit = await exportService.checkExportRateLimit(
    req.user._id.toString(),
    redisConnection,
  );

  if (!rateLimit.allowed) {
    throw new AppError(rateLimit.message, 429, "RATE_LIMIT_EXCEEDED");
  }

  // Verify donation access
  const donation = await Donation.findById(id).select("donor").lean();

  if (!donation) {
    throw new AppError("Donation not found", 404, "DONATION_NOT_FOUND");
  }

  const userId = req.user._id.toString();
  const userRole = req.user.role;

  if (
    donation.donor.toString() !== userId &&
    !["ADMIN", "NGO", "GOVERNMENT"].includes(userRole)
  ) {
    throw new AppError(
      "Unauthorized to export this timeline",
      403,
      "UNAUTHORIZED",
    );
  }

  // Get timeline data
  const timelineData = await timelineService.getDonationTimeline(id, {});

  // Generate CSV
  const csv = exportService.exportTimelineToCSV(timelineData);

  // Log export event
  await createAuditLog({
    eventType: "TIMELINE_EXPORTED",
    eventCategory: "DONATION",
    entityId: id,
    entityType: "Donation",
    jobIdHash: `export-${id}-${Date.now()}`,
    actorId: req.user._id,
    actorRole: req.user.role,
    payload: {
      format: "CSV",
      eventCount: timelineData.timeline.length,
    },
  });

  // Set response headers
  const filename = exportService.getExportFilename(id, "CSV");
  res.set("Content-Type", "text/csv");
  res.set("Content-Disposition", `attachment; filename="${filename}"`);
  res.set("X-Rate-Limit-Remaining", rateLimit.remaining.toString());

  res.send(csv);
});

/**
 * Export timeline to PDF (HTML format for now)
 * GET /api/donations/:id/timeline/export/pdf
 */
export const exportTimelineToPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check rate limit
  const rateLimit = await exportService.checkExportRateLimit(
    req.user._id.toString(),
    redisConnection,
  );

  if (!rateLimit.allowed) {
    throw new AppError(rateLimit.message, 429, "RATE_LIMIT_EXCEEDED");
  }

  // Verify donation access
  const donation = await Donation.findById(id).select("donor").lean();

  if (!donation) {
    throw new AppError("Donation not found", 404, "DONATION_NOT_FOUND");
  }

  const userId = req.user._id.toString();
  const userRole = req.user.role;

  if (
    donation.donor.toString() !== userId &&
    !["ADMIN", "NGO", "GOVERNMENT"].includes(userRole)
  ) {
    throw new AppError(
      "Unauthorized to export this timeline",
      403,
      "UNAUTHORIZED",
    );
  }

  // Get timeline data
  const timelineData = await timelineService.getDonationTimeline(id, {});

  // Generate HTML for PDF
  const html = exportService.exportTimelineToPDF(timelineData);

  // Log export event
  await createAuditLog({
    eventType: "TIMELINE_EXPORTED",
    eventCategory: "DONATION",
    entityId: id,
    entityType: "Donation",
    jobIdHash: `export-${id}-${Date.now()}`,
    actorId: req.user._id,
    actorRole: req.user.role,
    payload: {
      format: "PDF",
      eventCount: timelineData.timeline.length,
    },
  });

  // Set response headers
  const filename = exportService.getExportFilename(id, "HTML");
  res.set("Content-Type", "text/html");
  res.set("Content-Disposition", `inline; filename="${filename}"`);
  res.set("X-Rate-Limit-Remaining", rateLimit.remaining.toString());

  res.send(html);
});
