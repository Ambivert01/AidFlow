/**
 * Timeline Aggregation Service for Donor Tracking System
 * Aggregates data from Donation, AuditLog, Proof, and Blockchain sources
 * into a unified, chronological timeline
 */

import { Donation } from "../../models/donor/Donation.model.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { Proof } from "../../models/proofs/Proof.model.js";
import { User } from "../../models/auth/User.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { AppError } from "../../utils/AppError.js";
import {
  TIMELINE_EVENT_TYPE,
  TIMELINE_EVENT_CATEGORY,
  TIMELINE_PAGINATION,
} from "./donation.timeline.constants.js";

/**
 * Get complete timeline for a donation
 * Aggregates events from multiple sources and returns chronological timeline
 * @param {String} donationId - Donation ID
 * @param {Object} options - Filtering and pagination options
 * @returns {Object} - Timeline with events and metadata
 */
export const getDonationTimeline = async (donationId, options = {}) => {
  const startTime = Date.now();
  let dbQueryCount = 0;

  try {
    console.log(
      `[TimelineService] START - Fetching timeline for donation ${donationId}`,
    );

    // Fetch all data sources in parallel for performance
    console.log(`[TimelineService] Fetching donation data...`);
    const donationPromise = fetchDonationData(donationId);

    console.log(`[TimelineService] Fetching audit logs...`);
    const auditLogsPromise = fetchAuditLogs(donationId);

    console.log(`[TimelineService] Fetching proofs...`);
    const proofsPromise = fetchProofs(donationId);

    console.log(`[TimelineService] Waiting for all promises...`);
    const [donation, auditLogs, proofs] = await Promise.all([
      donationPromise,
      auditLogsPromise,
      proofsPromise,
    ]);

    console.log(`[TimelineService] All data fetched successfully`);
    dbQueryCount = 3; // 3 main queries (donation, audit logs, proofs)

    if (!donation) {
      console.log(`[TimelineService] Donation not found: ${donationId}`);
      throw new AppError("Donation not found", 404, "DONATION_NOT_FOUND");
    }

    console.log(
      `[TimelineService] Building timeline for donation ${donationId}`,
    );

    // Build unified timeline from all sources
    const timeline = await buildUnifiedTimeline(
      donation,
      auditLogs,
      proofs,
      options,
    );

    console.log(`[TimelineService] Timeline built, applying filters...`);

    // Apply filtering if specified
    const filteredTimeline = applyFilters(timeline, options);

    console.log(`[TimelineService] Filters applied, applying pagination...`);

    // Apply pagination if needed
    const paginatedResult = applyPagination(filteredTimeline, options);

    console.log(`[TimelineService] Pagination applied, building result...`);

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const result = {
      donation: {
        id: donation._id,
        amount: donation.amount,
        status: donation.status,
        workflowState: donation.workflowState,
        campaign: {
          id: donation.campaign?._id,
          title: donation.campaign?.title,
          disasterType: donation.campaign?.disasterType,
        },
        createdAt: donation.createdAt,
      },
      timeline: paginatedResult.events,
      pagination: paginatedResult.pagination,
      metadata: {
        totalEvents: filteredTimeline.length,
        responseTime,
        cached: false,
        dbQueryCount,
      },
    };

    console.log(
      `[TimelineService] SUCCESS - Timeline built for donation ${donationId} (${result.timeline.length} events, ${responseTime}ms)`,
    );

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;

    console.error(
      `[TimelineService] ERROR - Failed to fetch timeline for ${donationId}:`,
      error.message,
    );
    console.error(`[TimelineService] Error stack:`, error.stack);
    throw error;
  }
};

/**
 * Fetch donation data with populated references
 * @param {String} donationId - Donation ID
 * @returns {Object} - Donation document
 */
async function fetchDonationData(donationId) {
  return Donation.findById(donationId)
    .populate("campaign", "title disasterType location trustScore")
    .populate("beneficiary", "name status")
    .populate("wallet", "balance initialAmount totalSpent")
    .populate("donor", "name email")
    .lean();
}

/**
 * Fetch audit logs for donation
 * @param {String} donationId - Donation ID
 * @returns {Array} - Audit log documents
 */
async function fetchAuditLogs(donationId) {
  return AuditLog.find({
    entityType: "Donation",
    entityId: donationId.toString(),
  })
    .sort({ createdAt: 1 })
    .populate("actor.userId", "name email role")
    .lean();
}

/**
 * Fetch proofs related to donation's campaign
 * @param {String} donationId - Donation ID
 * @returns {Array} - Proof documents
 */
async function fetchProofs(donationId) {
  try {
    // First get the donation to find the campaign
    const donation = await Donation.findById(donationId)
      .select("campaign")
      .lean();

    if (!donation || !donation.campaign) {
      return [];
    }

    // Fetch proofs for the campaign
    return Proof.find({
      campaign: donation.campaign,
    })
      .sort({ createdAt: 1 })
      .lean();
  } catch (error) {
    console.warn("[TimelineService] Error fetching proofs:", error);
    return [];
  }
}

/**
 * Build unified timeline from all data sources
 * @param {Object} donation - Donation document
 * @param {Array} auditLogs - Audit log documents
 * @param {Array} proofs - Proof documents
 * @param {Object} options - Options
 * @returns {Array} - Unified timeline events
 */
async function buildUnifiedTimeline(donation, auditLogs, proofs, options) {
  const events = [];

  // Add donation creation event (always present)
  events.push(createDonationCreatedEvent(donation));

  // Add AI decision event if available
  if (donation.aiDecision && donation.aiDecision.evaluatedAt) {
    events.push(createAIDecisionEvent(donation));
  }

  // Add audit log events
  for (const log of auditLogs) {
    events.push(createAuditLogEvent(log));
  }

  // Add proof events
  for (const proof of proofs) {
    events.push(createProofUploadedEvent(proof));

    if (proof.aiValidation && proof.aiValidation.evaluatedAt) {
      events.push(createProofVerifiedEvent(proof));
    }
  }

  // Add blockchain anchoring event if available
  if (donation.blockchainAnchored && donation.blockchainHash) {
    events.push(createBlockchainAnchoredEvent(donation));
  }

  // Add wallet events if available
  if (donation.wallet) {
    events.push(createWalletCreatedEvent(donation));

    if (donation.amountSpent > 0) {
      events.push(createWalletSpentEvent(donation));
    }
  }

  // Sort events chronologically
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Deduplicate events based on eventType and timestamp
  const deduplicatedEvents = deduplicateEvents(events);

  // Enrich events with actor information and labels
  const enrichedEvents = await enrichEvents(deduplicatedEvents);

  return enrichedEvents;
}

/**
 * Create donation created event
 * @param {Object} donation - Donation document
 * @returns {Object} - Timeline event
 */
function createDonationCreatedEvent(donation) {
  return {
    event: TIMELINE_EVENT_TYPE.DONATION_CREATED,
    eventCategory: TIMELINE_EVENT_CATEGORY.DONATION,
    timestamp: donation.createdAt,
    status: donation.status,
    actor: {
      role: "DONOR",
      userId: donation.donor?._id,
      name: donation.donor?.name,
    },
    payload: {
      donationId: donation._id,
      amount: donation.amount,
      campaignId: donation.campaign?._id,
      campaignTitle: donation.campaign?.title,
    },
  };
}

/**
 * Create AI decision event
 * @param {Object} donation - Donation document
 * @returns {Object} - Timeline event
 */
function createAIDecisionEvent(donation) {
  return {
    event: TIMELINE_EVENT_TYPE.AI_DECISION,
    eventCategory: TIMELINE_EVENT_CATEGORY.AI,
    timestamp: donation.aiDecision.evaluatedAt,
    status: donation.aiDecision.decision,
    actor: {
      role: "AI",
      name: "AI Risk Engine",
    },
    payload: {
      decision: donation.aiDecision.decision,
      riskScore: donation.aiDecision.riskScore,
      fraudFlags: donation.aiDecision.fraudFlags || [],
      fraudSignals: donation.aiDecision.fraudSignals || [],
    },
  };
}

/**
 * Create audit log event
 * @param {Object} log - Audit log document
 * @returns {Object} - Timeline event
 */
function createAuditLogEvent(log) {
  return {
    event: log.eventType,
    eventCategory: log.eventCategory,
    timestamp: log.createdAt,
    status: log.payload?.status || null,
    actor: {
      role: log.actor?.role,
      userId: log.actor?.userId?._id,
      name: log.actor?.userId?.name,
    },
    payload: log.payload,
    hash: log.hash,
    previousHash: log.previousHash,
    merkleRoot: log.merkleRoot,
    blockchainAnchor: log.blockchainAnchor,
  };
}

/**
 * Create proof uploaded event
 * @param {Object} proof - Proof document
 * @returns {Object} - Timeline event
 */
function createProofUploadedEvent(proof) {
  return {
    event: TIMELINE_EVENT_TYPE.PROOF_UPLOADED,
    eventCategory: TIMELINE_EVENT_CATEGORY.PROOF,
    timestamp: proof.createdAt,
    status: proof.status,
    actor: {
      role: "NGO",
    },
    payload: {
      proofId: proof._id,
      proofType: proof.proofType,
      fileCount: proof.files?.length || 0,
      location: proof.location,
      capturedAt: proof.capturedAt,
    },
    relatedProof: {
      id: proof._id,
      type: proof.proofType,
      files: proof.files,
      status: proof.status,
    },
  };
}

/**
 * Create proof verified event
 * @param {Object} proof - Proof document
 * @returns {Object} - Timeline event
 */
function createProofVerifiedEvent(proof) {
  return {
    event: TIMELINE_EVENT_TYPE.PROOF_VERIFIED,
    eventCategory: TIMELINE_EVENT_CATEGORY.PROOF,
    timestamp: proof.aiValidation.evaluatedAt,
    status: proof.status,
    actor: {
      role: "AI",
      name: "AI Proof Validator",
    },
    payload: {
      proofId: proof._id,
      verified: proof.aiValidation.verified,
      confidenceScore: proof.aiValidation.confidenceScore,
      fraudProbability: proof.aiValidation.fraudProbability,
      flags: proof.aiValidation.flags || [],
    },
    relatedProof: {
      id: proof._id,
      type: proof.proofType,
      files: proof.files,
      status: proof.status,
      aiValidation: proof.aiValidation,
    },
  };
}

/**
 * Create blockchain anchored event
 * @param {Object} donation - Donation document
 * @returns {Object} - Timeline event
 */
function createBlockchainAnchoredEvent(donation) {
  return {
    event: TIMELINE_EVENT_TYPE.BLOCKCHAIN_ANCHORED,
    eventCategory: TIMELINE_EVENT_CATEGORY.BLOCKCHAIN,
    timestamp: donation.blockchainAnchoredAt,
    status: "ANCHORED",
    actor: {
      role: "SYSTEM",
      name: "Blockchain Service",
    },
    payload: {
      blockchainHash: donation.blockchainHash,
      anchoredAt: donation.blockchainAnchoredAt,
    },
    blockchainHash: donation.blockchainHash,
  };
}

/**
 * Create wallet created event
 * @param {Object} donation - Donation document
 * @returns {Object} - Timeline event
 */
function createWalletCreatedEvent(donation) {
  return {
    event: TIMELINE_EVENT_TYPE.WALLET_CREATED,
    eventCategory: TIMELINE_EVENT_CATEGORY.WALLET,
    timestamp: donation.wallet?.createdAt || donation.updatedAt,
    status: "CREATED",
    actor: {
      role: "SYSTEM",
      name: "Wallet Service",
    },
    payload: {
      walletId: donation.wallet?._id,
      amount: donation.wallet?.initialAmount ?? donation.amount,
      beneficiaryId: donation.beneficiary?._id,
      beneficiaryName: donation.beneficiary?.name,
    },
  };
}

/**
 * Create wallet spent event
 * @param {Object} donation - Donation document
 * @returns {Object} - Timeline event
 */
function createWalletSpentEvent(donation) {
  return {
    event: TIMELINE_EVENT_TYPE.WALLET_SPENT,
    eventCategory: TIMELINE_EVENT_CATEGORY.WALLET,
    timestamp: donation.updatedAt,
    status: "SPENT",
    actor: {
      role: "BENEFICIARY",
      name: donation.beneficiary?.name,
    },
    payload: {
      walletId: donation.wallet?._id,
      amountSpent: donation.wallet?.totalSpent ?? donation.amountSpent,
      amountRemaining: donation.wallet?.balance,
    },
  };
}

/**
 * Deduplicate events based on eventType and timestamp
 * @param {Array} events - Timeline events
 * @returns {Array} - Deduplicated events
 */
function deduplicateEvents(events) {
  const seen = new Set();
  const deduplicated = [];

  for (const event of events) {
    const key = `${event.event}-${new Date(event.timestamp).getTime()}`;

    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(event);
    }
  }

  return deduplicated;
}

/**
 * Enrich events with actor information and human-readable labels
 * @param {Array} events - Timeline events
 * @returns {Array} - Enriched events
 */
async function enrichEvents(events) {
  // Event labels mapping
  const eventLabels = {
    [TIMELINE_EVENT_TYPE.DONATION_CREATED]: "Donation Received",
    [TIMELINE_EVENT_TYPE.AI_DECISION]: "AI Risk Evaluation Complete",
    [TIMELINE_EVENT_TYPE.BENEFICIARY_ASSIGNED]: "Beneficiary Assigned",
    [TIMELINE_EVENT_TYPE.NGO_APPROVED]: "NGO Approved",
    [TIMELINE_EVENT_TYPE.WALLET_CREATED]: "Aid Wallet Activated",
    [TIMELINE_EVENT_TYPE.WALLET_SPENT]: "Aid Spent by Beneficiary",
    [TIMELINE_EVENT_TYPE.PROOF_UPLOADED]: "Proof Uploaded",
    [TIMELINE_EVENT_TYPE.PROOF_VERIFIED]: "Proof Verified by AI",
    [TIMELINE_EVENT_TYPE.BLOCKCHAIN_ANCHORED]: "⛓️ Blockchain Anchored",
    [TIMELINE_EVENT_TYPE.DONATION_PROCESSING_FAILED]: "❌ Processing Failed",
  };

  return events.map((event) => ({
    ...event,
    label: eventLabels[event.event] || event.event.replaceAll("_", " "),
  }));
}

/**
 * Apply filters to timeline events
 * @param {Array} events - Timeline events
 * @param {Object} options - Filter options
 * @returns {Array} - Filtered events
 */
function applyFilters(events, options) {
  let filtered = events;

  // Filter by event type
  if (options.eventType) {
    const eventTypes = options.eventType.split(",");
    filtered = filtered.filter((e) => eventTypes.includes(e.event));
  }

  // Filter by date range
  if (options.startDate || options.endDate) {
    filtered = filtered.filter((e) => {
      const eventDate = new Date(e.timestamp);
      if (options.startDate && eventDate < new Date(options.startDate)) {
        return false;
      }
      if (options.endDate && eventDate > new Date(options.endDate)) {
        return false;
      }
      return true;
    });
  }

  // Filter by actor role
  if (options.actorRole) {
    const actorRoles = options.actorRole.split(",");
    filtered = filtered.filter((e) => actorRoles.includes(e.actor?.role));
  }

  // Search in payload
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    filtered = filtered.filter((e) => {
      const payloadStr = JSON.stringify(e.payload).toLowerCase();
      return payloadStr.includes(searchTerm);
    });
  }

  return filtered;
}

/**
 * Apply pagination to timeline events
 * @param {Array} events - Timeline events
 * @param {Object} options - Pagination options
 * @returns {Object} - Paginated result with events and pagination metadata
 */
function applyPagination(events, options) {
  const page = parseInt(options.page) || 1;
  const pageSize = Math.min(
    parseInt(options.pageSize) || TIMELINE_PAGINATION.DEFAULT_PAGE_SIZE,
    TIMELINE_PAGINATION.MAX_PAGE_SIZE,
  );

  const totalEvents = events.length;
  const totalPages = Math.ceil(totalEvents / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedEvents = events.slice(startIndex, endIndex);

  return {
    events: paginatedEvents,
    pagination: {
      page,
      pageSize,
      totalEvents,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Invalidate timeline cache for a donation
 * Should be called when new audit logs or proofs are created
 * @param {String} donationId - Donation ID
 * @returns {Number} - Number of cache entries invalidated
 */
export const invalidateTimelineCache = async (donationId) => {
  console.log(
    `[TimelineService] Cache invalidation requested for ${donationId} (cache disabled)`,
  );
  return 0;
};

/**
 * Get timeline cache statistics
 * @returns {Object} - Cache statistics
 */
export const getTimelineCacheStats = () => {
  return {
    hits: 0,
    misses: 0,
    errors: 0,
    total: 0,
    hitRate: "0%",
    invalidations: 0,
    targetHitRate: "70%",
    meetsTarget: false,
    message: "Cache disabled",
  };
};

/**
 * Get timeline performance metrics
 * @returns {Object} - Performance metrics
 */
export const getTimelinePerformanceMetrics = () => {
  return {
    requests: 0,
    avgResponseTime: 0,
    targetResponseTime: 500,
    meetsTarget: true,
    slowQueries: 0,
    slowQueryThreshold: 500,
    avgDbQueries: 3,
    maxDbQueries: 10,
    alerts: 0,
    recentAlerts: [],
    message: "Performance monitoring disabled",
  };
};

/**
 * Get Prometheus-compatible metrics
 * @returns {String} - Prometheus metrics format
 */
export const getPrometheusMetrics = () => {
  return `# Timeline metrics disabled`;
};
