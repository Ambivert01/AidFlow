/**
 * Timeline Error Handler
 *
 * Provides comprehensive error handling and graceful degradation
 * for the donor tracking timeline system.
 */

import { Donation } from "../../models/donor/Donation.model.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";

/**
 * Get timeline with graceful degradation
 * Falls back to partial data if some sources are unavailable
 */
export const getTimelineWithFallback = async (donationId, options = {}) => {
  const errors = [];
  const warnings = [];
  let donation = null;
  let auditLogs = [];
  let proofs = [];
  let trustHistory = [];
  let blockchainVerification = null;

  // Try to fetch donation (critical)
  try {
    donation = await Donation.findById(donationId)
      .populate("campaign", "title disasterType location")
      .populate("ngo", "name")
      .populate("beneficiary", "name status")
      .lean();

    if (!donation) {
      throw new Error("Donation not found");
    }
  } catch (error) {
    errors.push({
      source: "donation",
      message: "Failed to load donation details",
      error: error.message,
    });
    // Cannot proceed without donation
    throw error;
  }

  // Try to fetch audit logs (important but not critical)
  try {
    auditLogs = await AuditLog.find({
      entityType: "Donation",
      entityId: donationId,
    })
      .sort({ createdAt: 1 })
      .lean();
  } catch (error) {
    warnings.push({
      source: "auditLogs",
      message: "Audit logs unavailable, showing donation record only",
      error: error.message,
    });
  }

  // Try to fetch proofs (optional)
  try {
    if (donation.campaign) {
      const Proof = (await import("../../models/proofs/Proof.model.js")).Proof;
      proofs = await Proof.find({
        campaign: donation.campaign._id,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }
  } catch (error) {
    warnings.push({
      source: "proofs",
      message: "Proof data unavailable",
      error: error.message,
    });
  }

  // Try to fetch trust history (optional)
  try {
    const trustService = await import("./donation.trust.service.js");
    trustHistory = await trustService.getTrustScoreHistory(donationId);
  } catch (error) {
    warnings.push({
      source: "trustHistory",
      message: "Trust score history unavailable",
      error: error.message,
    });
  }

  // Try to verify blockchain (optional)
  try {
    if (donation.blockchainAnchored) {
      const blockchainService =
        await import("./donation.blockchain.service.js");
      blockchainVerification = await blockchainService.verifyBlockchainAnchor(
        donation.blockchainHash,
        donation.blockchainNetwork,
      );
    }
  } catch (error) {
    warnings.push({
      source: "blockchain",
      message: "Blockchain verification unavailable",
      error: error.message,
    });
  }

  // Build fallback timeline from available data
  const timeline = buildFallbackTimeline(donation, auditLogs, proofs);

  return {
    donation,
    timeline,
    trustHistory,
    blockchainVerification,
    metadata: {
      degraded: warnings.length > 0,
      warnings,
      errors,
      availableSources: {
        donation: true,
        auditLogs: auditLogs.length > 0,
        proofs: proofs.length > 0,
        trustHistory: trustHistory.length > 0,
        blockchain: blockchainVerification !== null,
      },
    },
  };
};

/**
 * Build fallback timeline from donation record only
 * Used when audit logs are unavailable
 */
const buildFallbackTimeline = (donation, auditLogs = [], proofs = []) => {
  const events = [];

  // Add donation creation event
  events.push({
    eventType: "DONATION_CREATED",
    timestamp: donation.createdAt,
    actor: {
      role: "DONOR",
      name: donation.donor?.name,
    },
    description: `Donation of ₹${donation.amount} received`,
    metadata: {
      amount: donation.amount,
      campaign: donation.campaign?.title,
    },
    source: "donation",
  });

  // Add AI decision event if available
  if (donation.aiDecision) {
    events.push({
      eventType: "AI_DECISION",
      timestamp: donation.aiDecision.evaluatedAt || donation.createdAt,
      actor: {
        role: "AI",
      },
      description: `AI Risk Evaluation: ${donation.aiDecision.decision}`,
      metadata: {
        decision: donation.aiDecision.decision,
        riskScore: donation.aiDecision.riskScore,
        fraudFlags: donation.aiDecision.fraudFlags,
      },
      source: "donation",
    });
  }

  // Add beneficiary assignment if available
  if (donation.beneficiary) {
    events.push({
      eventType: "BENEFICIARY_ASSIGNED",
      timestamp: donation.updatedAt,
      actor: {
        role: "NGO",
        name: donation.ngo?.name,
      },
      description: `Beneficiary assigned: ${donation.beneficiary.name}`,
      metadata: {
        beneficiary: donation.beneficiary.name,
        status: donation.beneficiary.status,
      },
      source: "donation",
    });
  }

  // Add wallet creation if available
  if (donation.wallet) {
    events.push({
      eventType: "WALLET_CREATED",
      timestamp: donation.updatedAt,
      actor: {
        role: "SYSTEM",
      },
      description: "Aid wallet activated",
      metadata: {
        walletId: donation.wallet,
      },
      source: "donation",
    });
  }

  // Add blockchain anchoring if available
  if (donation.blockchainAnchored) {
    events.push({
      eventType: "BLOCKCHAIN_ANCHORED",
      timestamp: donation.blockchainAnchoredAt || donation.updatedAt,
      actor: {
        role: "SYSTEM",
      },
      description: "Transaction anchored to blockchain",
      metadata: {
        txHash: donation.blockchainHash,
        network: donation.blockchainNetwork,
      },
      source: "donation",
    });
  }

  // Add audit log events if available
  if (auditLogs.length > 0) {
    auditLogs.forEach((log) => {
      events.push({
        eventType: log.eventType,
        timestamp: log.createdAt,
        actor: {
          role: log.actor?.role || "SYSTEM",
          name: log.actor?.name,
        },
        description: log.description || log.eventType.replace(/_/g, " "),
        metadata: log.payload || {},
        source: "auditLog",
      });
    });
  }

  // Add proof events if available
  if (proofs.length > 0) {
    proofs.forEach((proof) => {
      events.push({
        eventType: "PROOF_UPLOADED",
        timestamp: proof.createdAt,
        actor: {
          role: "NGO",
        },
        description: "Proof of impact uploaded",
        metadata: {
          proofId: proof._id,
          fileCount: proof.files?.length || 0,
          aiValidation: proof.aiValidation?.status,
        },
        source: "proof",
      });
    });
  }

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return events;
};

/**
 * Handle partial data display
 * Shows warning messages for missing data sources
 */
export const getWarningMessages = (metadata) => {
  const messages = [];

  if (!metadata.availableSources.auditLogs) {
    messages.push({
      type: "warning",
      message:
        "Audit logs are currently unavailable. Showing donation record only.",
      action: "Refresh the page to try again.",
    });
  }

  if (!metadata.availableSources.proofs) {
    messages.push({
      type: "info",
      message: "Proof data is currently unavailable.",
      action: "Check back later for proof of impact.",
    });
  }

  if (!metadata.availableSources.trustHistory) {
    messages.push({
      type: "info",
      message: "Trust score history is currently unavailable.",
      action: null,
    });
  }

  if (!metadata.availableSources.blockchain) {
    messages.push({
      type: "info",
      message: "Blockchain verification is currently unavailable.",
      action: "This donation may not be anchored yet.",
    });
  }

  return messages;
};

/**
 * Retry failed operations with exponential backoff
 */
export const retryWithBackoff = async (
  operation,
  maxRetries = 3,
  baseDelay = 1000,
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Validate timeline data integrity
 */
export const validateTimelineIntegrity = (timeline) => {
  const issues = [];

  // Check for duplicate events
  const eventHashes = new Set();
  timeline.forEach((event, index) => {
    const hash = `${event.eventType}_${event.timestamp}`;
    if (eventHashes.has(hash)) {
      issues.push({
        type: "duplicate",
        index,
        message: `Duplicate event detected: ${event.eventType}`,
      });
    }
    eventHashes.add(hash);
  });

  // Check for chronological order
  for (let i = 1; i < timeline.length; i++) {
    if (new Date(timeline[i].timestamp) < new Date(timeline[i - 1].timestamp)) {
      issues.push({
        type: "order",
        index: i,
        message: "Events are not in chronological order",
      });
    }
  }

  // Check for missing critical events
  const eventTypes = timeline.map((e) => e.eventType);
  if (!eventTypes.includes("DONATION_CREATED")) {
    issues.push({
      type: "missing",
      message: "Missing DONATION_CREATED event",
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};

export default {
  getTimelineWithFallback,
  getWarningMessages,
  retryWithBackoff,
  validateTimelineIntegrity,
  buildFallbackTimeline,
};
