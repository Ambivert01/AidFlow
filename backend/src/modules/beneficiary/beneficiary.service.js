import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { AppError } from "../../utils/AppError.js";
import { BaseService } from "../../core/base.service.js";
import { withTransaction } from "../../core/transaction.js";
import {
  BENEFICIARY_STATUS,
  AUDIT_EVENTS,
  NOTIFICATION_TYPES,
} from "./beneficiary.constants.js";
import { addAIDecisionJob } from "../../jobs/ai.job.js";
import { createAuditLog } from "../audit/audit.service.js";
import { Notification } from "../../models/system/Notification.model.js";
import crypto from "crypto";

// HELPER FUNCTIONS

/**
 * Hash PII data using SHA-256
 */
const hashPII = (data) => {
  if (!data) return null;
  return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * Check for duplicate beneficiary in same campaign
 */
const checkDuplicateBeneficiary = async (
  aadhaarHash,
  phoneHash,
  campaignId,
) => {
  if (aadhaarHash) {
    const duplicate = await Beneficiary.findOne({
      aadhaarHash,
      campaign: campaignId,
    });
    if (duplicate) {
      throw new AppError(
        "Beneficiary already registered for this campaign",
        409,
      );
    }
  }

  if (phoneHash) {
    const duplicate = await Beneficiary.findOne({
      phoneHash,
      campaign: campaignId,
    });
    if (duplicate) {
      throw new AppError(
        "Beneficiary already registered for this campaign",
        409,
      );
    }
  }
};

/**
 * Add verification history entry
 */
const addVerificationHistory = (
  beneficiary,
  action,
  performedBy,
  reason = null,
) => {
  beneficiary.verificationHistory.push({
    action,
    performedBy,
    reason,
    timestamp: new Date(),
  });
};

/**
 * Create beneficiary audit log
 */
const createBeneficiaryAuditLog = async (
  beneficiary,
  eventType,
  actor,
  additionalData = {},
  session = null,
) => {
  return await createAuditLog(
    {
      eventType,
      eventCategory: "BENEFICIARY",
      entityId: beneficiary._id.toString(),
      entityType: "Beneficiary",
      campaignId: beneficiary.campaign.toString(),
      actorId: actor._id ? actor._id.toString() : actor.toString(),
      actorRole: actor.role || "NGO",
      payload: {
        beneficiaryName: beneficiary.name,
        status: beneficiary.status,
        ...additionalData,
      },
      aiMetadata: {
        decision: beneficiary.aiDecision?.decision || null,
        riskScore: beneficiary.riskScore || null,
        flags: beneficiary.aiDecision?.flags || [],
      },
    },
    session,
  );
};

/**
 * Send beneficiary notification
 */
const sendBeneficiaryNotification = async (
  beneficiary,
  notificationType,
  additionalData = {},
) => {
  if (!beneficiary.user) return; // No user linked, skip notification

  const notificationConfig = {
    BENEFICIARY_APPROVED: {
      title: "Application Approved",
      message: `Your beneficiary application for ${additionalData.campaignName || "the campaign"} has been approved. You will receive aid soon.`,
      priority: "HIGH",
    },
    BENEFICIARY_REJECTED: {
      title: "Application Rejected",
      message: `Your beneficiary application has been rejected. Reason: ${additionalData.reason}. You can appeal this decision.`,
      priority: "NORMAL",
    },
    BENEFICIARY_APPEAL_DECIDED: {
      title: "Appeal Decision",
      message: `Your appeal has been ${additionalData.decision}. ${additionalData.reason}`,
      priority: "HIGH",
    },
    BENEFICIARY_BLOCKED: {
      title: "Application Blocked",
      message: `Your beneficiary application has been blocked due to security concerns. Please contact support.`,
      priority: "CRITICAL",
    },
  };

  const config = notificationConfig[notificationType];

  await Notification.create({
    recipient: beneficiary.user,
    role: "BENEFICIARY",
    type: notificationType,
    title: config.title,
    message: config.message,
    entityType: "Beneficiary",
    entityId: beneficiary._id.toString(),
    channels: ["IN_APP", "SMS"],
    priority: config.priority,
    deliveryStatus: "PENDING",
  });
};

// SERVICE FUNCTIONS

/**
 * Register beneficiary with duplicate detection and AI evaluation
 */
export const registerBeneficiary = async (userId, data, session = null) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    // Validate campaign exists and is active
    const campaign = await Campaign.findById(data.campaignId).session(
      activeSession,
    );
    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }
    if (campaign.status !== "ACTIVE") {
      throw new AppError(
        "Campaign must be active for beneficiary registration",
        400,
      );
    }

    // Hash PII data
    const aadhaarHash = data.aadhaar ? hashPII(data.aadhaar) : null;
    const phoneHash = hashPII(data.phone);

    // Check for duplicates in same campaign
    await checkDuplicateBeneficiary(aadhaarHash, phoneHash, data.campaignId);

    // Create beneficiary with PENDING status
    const beneficiaryData = {
      user: userId,
      campaign: data.campaignId,
      name: data.name,
      phone: data.phone,
      aadhaarHash,
      phoneHash,
      location: data.location,
      household: data.household,
      displacementStatus: data.displacementStatus || "UNKNOWN",
      incomeLevel: data.incomeLevel || "UNKNOWN",
      documents: data.documents || [],
      status: BENEFICIARY_STATUS.PENDING,
      registeredBy: userId,
      registrationSource: "NGO",
      verificationHistory: [
        {
          action: "REGISTERED",
          performedBy: userId,
          reason: null,
          timestamp: new Date(),
        },
      ],
    };

    const beneficiary = await Beneficiary.create([beneficiaryData], {
      session: activeSession,
    });
    const createdBeneficiary = beneficiary[0];

    // Create audit log
    await createBeneficiaryAuditLog(
      createdBeneficiary,
      AUDIT_EVENTS.BENEFICIARY_REGISTERED,
      { _id: userId, role: "NGO" },
      {
        campaignName: campaign.title,
        location: data.location,
      },
      activeSession,
    );

    // Trigger AI eligibility job (async, outside transaction)
    if (!session) {
      // Only trigger if not in external transaction
      await addAIDecisionJob({
        type: "beneficiary-eligibility",
        payload: {
          beneficiaryId: createdBeneficiary._id.toString(),
          campaignId: data.campaignId,
          name: data.name,
          phone: data.phone,
          aadhaarHash,
          phoneHash,
          location: data.location,
          household: data.household,
          displacementStatus: data.displacementStatus || "UNKNOWN",
          incomeLevel: data.incomeLevel || "UNKNOWN",
          documents: data.documents || [],
        },
      });
    }

    return BaseService.created(createdBeneficiary);
  }, session);
};

/**
 * Approve beneficiary by NGO
 */
export const approveBeneficiaryByNGO = async (
  beneficiaryId,
  ngoId,
  session = null,
) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(activeSession);

    if (!beneficiary) {
      throw new AppError("Beneficiary not found", 404);
    }

    // AI SAFETY CHECK - prevents NGO approving fraudulent beneficiary
    if (beneficiary.aiDecision?.decision === "BLOCK") {
      throw new AppError(
        "Cannot approve beneficiary blocked by AI risk engine. Contact admin for override.",
        403,
      );
    }

    // Prevent double approval
    if (
      beneficiary.status === BENEFICIARY_STATUS.APPROVED ||
      beneficiary.status === BENEFICIARY_STATUS.NGO_APPROVED
    ) {
      throw new AppError("Beneficiary already approved", 400);
    }

    // Validate status is UNDER_REVIEW
    if (beneficiary.status !== BENEFICIARY_STATUS.UNDER_REVIEW) {
      throw new AppError(
        `Cannot approve beneficiary with status ${beneficiary.status}`,
        400,
      );
    }

    beneficiary.status = BENEFICIARY_STATUS.APPROVED;
    beneficiary.overrideByNgo = {
      decision: "APPROVED",
      ngo: ngoId,
      at: new Date(),
    };

    addVerificationHistory(beneficiary, "APPROVED", ngoId);

    await beneficiary.save({ session: activeSession });

    // Create audit log
    await createBeneficiaryAuditLog(
      beneficiary,
      AUDIT_EVENTS.BENEFICIARY_APPROVED,
      { _id: ngoId, role: "NGO" },
      {},
      activeSession,
    );

    // Send notification (async, outside transaction)
    if (!session) {
      const campaign = await Campaign.findById(beneficiary.campaign);
      await sendBeneficiaryNotification(
        beneficiary,
        NOTIFICATION_TYPES.BENEFICIARY_APPROVED,
        { campaignName: campaign?.title || "the campaign" },
      );
    }

    return BaseService.updated(beneficiary);
  }, session);
};

/**
 * Reject beneficiary by NGO
 */
export const rejectBeneficiaryByNGO = async (
  beneficiaryId,
  ngoId,
  reason,
  session = null,
) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(activeSession);

    if (!beneficiary) {
      throw new AppError("Beneficiary not found", 404);
    }

    // Validate status is UNDER_REVIEW
    if (beneficiary.status !== BENEFICIARY_STATUS.UNDER_REVIEW) {
      throw new AppError(
        `Cannot reject beneficiary with status ${beneficiary.status}`,
        400,
      );
    }

    // Validate rejection reason
    if (!reason || reason.length < 10) {
      throw new AppError(
        "Rejection reason must be at least 10 characters",
        400,
      );
    }

    beneficiary.status = BENEFICIARY_STATUS.REJECTED;
    beneficiary.overrideByNgo = {
      decision: "REJECTED",
      reason,
      ngo: ngoId,
      at: new Date(),
    };

    addVerificationHistory(beneficiary, "REJECTED", ngoId, reason);

    await beneficiary.save({ session: activeSession });

    // Create audit log
    await createBeneficiaryAuditLog(
      beneficiary,
      AUDIT_EVENTS.BENEFICIARY_REJECTED,
      { _id: ngoId, role: "NGO" },
      { rejectionReason: reason },
      activeSession,
    );

    // Send notification (async, outside transaction)
    if (!session) {
      await sendBeneficiaryNotification(
        beneficiary,
        NOTIFICATION_TYPES.BENEFICIARY_REJECTED,
        { reason },
      );
    }

    return BaseService.updated(beneficiary);
  }, session);
};

/**
 * Submit appeal for rejected beneficiary
 */
export const submitAppeal = async (
  beneficiaryId,
  userId,
  appealData,
  session = null,
) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(activeSession);

    if (!beneficiary) {
      throw new AppError("Beneficiary not found", 404);
    }

    // Validate status is REJECTED
    if (beneficiary.status !== BENEFICIARY_STATUS.REJECTED) {
      throw new AppError("Only rejected beneficiaries can appeal", 400);
    }

    // Validate appeal reason
    if (!appealData.reason || appealData.reason.length < 20) {
      throw new AppError("Appeal reason must be at least 20 characters", 400);
    }

    beneficiary.status = BENEFICIARY_STATUS.MANUAL_REVIEW;
    beneficiary.appeal = {
      reason: appealData.reason,
      documents: appealData.documents || [],
      submittedAt: new Date(),
      decision: null,
      decisionReason: null,
      decidedBy: null,
      decidedAt: null,
    };

    addVerificationHistory(
      beneficiary,
      "APPEAL_SUBMITTED",
      userId,
      appealData.reason,
    );

    await beneficiary.save({ session: activeSession });

    // Create audit log
    await createBeneficiaryAuditLog(
      beneficiary,
      AUDIT_EVENTS.BENEFICIARY_APPEAL_SUBMITTED,
      { _id: userId, role: "BENEFICIARY" },
      { appealReason: appealData.reason },
      activeSession,
    );

    // TODO: Send notification to NGO about appeal

    return BaseService.updated(beneficiary);
  }, session);
};

/**
 * Review appeal by NGO
 */
export const reviewAppeal = async (
  beneficiaryId,
  ngoId,
  decision,
  reason,
  session = null,
) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(activeSession);

    if (!beneficiary) {
      throw new AppError("Beneficiary not found", 404);
    }

    // Validate status is MANUAL_REVIEW with appeal submitted
    if (
      beneficiary.status !== BENEFICIARY_STATUS.MANUAL_REVIEW ||
      !beneficiary.appeal?.submittedAt
    ) {
      throw new AppError("No pending appeal for this beneficiary", 400);
    }

    // Validate decision
    if (!["APPROVED", "REJECTED"].includes(decision)) {
      throw new AppError("Decision must be APPROVED or REJECTED", 400);
    }

    // Validate reason
    if (!reason || reason.length < 10) {
      throw new AppError("Decision reason must be at least 10 characters", 400);
    }

    // Update status based on decision
    beneficiary.status =
      decision === "APPROVED"
        ? BENEFICIARY_STATUS.APPROVED
        : BENEFICIARY_STATUS.REJECTED;

    beneficiary.appeal.decision = decision;
    beneficiary.appeal.decisionReason = reason;
    beneficiary.appeal.decidedBy = ngoId;
    beneficiary.appeal.decidedAt = new Date();

    addVerificationHistory(
      beneficiary,
      "APPEAL_DECIDED",
      ngoId,
      `${decision}: ${reason}`,
    );

    await beneficiary.save({ session: activeSession });

    // Create audit log
    const eventType =
      decision === "APPROVED"
        ? AUDIT_EVENTS.BENEFICIARY_APPEAL_APPROVED
        : AUDIT_EVENTS.BENEFICIARY_APPEAL_REJECTED;

    await createBeneficiaryAuditLog(
      beneficiary,
      eventType,
      { _id: ngoId, role: "NGO" },
      { appealDecision: decision, appealReason: reason },
      activeSession,
    );

    // Send notification (async, outside transaction)
    if (!session) {
      await sendBeneficiaryNotification(
        beneficiary,
        NOTIFICATION_TYPES.BENEFICIARY_APPEAL_DECIDED,
        { decision, reason },
      );
    }

    return BaseService.updated(beneficiary);
  }, session);
};

/**
 * Get campaign beneficiaries
 */
export const getCampaignBeneficiaries = async (campaignId) => {
  const beneficiaries = await Beneficiary.find({
    campaign: campaignId,
  });

  return BaseService.success(beneficiaries);
};

/**
 * Get NGO beneficiaries with filters
 */
export const getNGOBeneficiaries = async (ngoId, filters = {}) => {
  // Get NGO's campaigns
  const campaigns = await Campaign.find({ ngo: ngoId }).select("_id");
  const campaignIds = campaigns.map((c) => c._id);

  // Build query
  const query = { campaign: { $in: campaignIds } };

  if (filters.campaign) {
    query.campaign = filters.campaign;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: "i" } },
      { phone: { $regex: filters.search, $options: "i" } },
    ];
  }

  if (filters.minAIScore !== undefined) {
    query["aiDecision.eligibilityConfidence"] = { $gte: filters.minAIScore };
  }

  if (filters.maxAIScore !== undefined) {
    query["aiDecision.eligibilityConfidence"] = {
      ...query["aiDecision.eligibilityConfidence"],
      $lte: filters.maxAIScore,
    };
  }

  // Pagination
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 50;
  const skip = (page - 1) * limit;

  const beneficiaries = await Beneficiary.find(query)
    .populate("campaign", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Beneficiary.countDocuments(query);

  return BaseService.success({
    beneficiaries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

/**
 * Get beneficiary details
 */
export const getBeneficiaryDetails = async (
  beneficiaryId,
  userId,
  userRole,
) => {
  const beneficiary = await Beneficiary.findById(beneficiaryId)
    .populate("campaign", "title ngo")
    .populate("registeredBy", "name email")
    .populate("overrideByNgo.ngo", "name email")
    .populate("appeal.decidedBy", "name email");

  if (!beneficiary) {
    throw new AppError("Beneficiary not found", 404);
  }

  // Authorization check
  if (userRole === "NGO") {
    const campaign = await Campaign.findById(beneficiary.campaign._id);
    if (campaign.ngo.toString() !== userId.toString()) {
      throw new AppError("Access denied", 403);
    }
  } else if (userRole === "BENEFICIARY") {
    if (beneficiary.user?.toString() !== userId.toString()) {
      throw new AppError("Access denied", 403);
    }
  }
  // ADMIN has full access

  return BaseService.success(beneficiary);
};

/**
 * Get my beneficiary profile
 */
export const getMyBeneficiaryProfile = async (userId) => {
  const beneficiary = await Beneficiary.findOne({
    user: userId,
  });

  if (!beneficiary) {
    throw new AppError("Beneficiary profile not found", 404);
  }

  return BaseService.success(beneficiary);
};

/**
 * Appeal decision (legacy function - use submitAppeal instead)
 */
export const appealDecision = async (id, reason) => {
  const beneficiary = await Beneficiary.findById(id);

  if (!beneficiary) {
    throw new AppError("Beneficiary not found", 404);
  }

  beneficiary.status = BENEFICIARY_STATUS.MANUAL_REVIEW;
  beneficiary.appeal = {
    reason,
    submittedAt: new Date(),
  };

  await beneficiary.save();

  return beneficiary;
};

/**
 * Bulk upload beneficiaries
 */
export const bulkUpload = async (ngoId, beneficiariesData, session = null) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const results = {
      success: [],
      failed: [],
    };

    for (const data of beneficiariesData) {
      try {
        // Validate and create each beneficiary
        const result = await registerBeneficiary(ngoId, data, activeSession);
        results.success.push({
          name: data.name,
          phone: data.phone,
          beneficiaryId: result.data._id,
        });
      } catch (error) {
        results.failed.push({
          name: data.name,
          phone: data.phone,
          error: error.message,
        });
      }
    }

    // Create audit log for bulk upload
    await createAuditLog(
      {
        eventType: AUDIT_EVENTS.BENEFICIARY_BULK_UPLOADED,
        eventCategory: "BENEFICIARY",
        entityId: ngoId.toString(),
        entityType: "User",
        actorId: ngoId.toString(),
        actorRole: "NGO",
        payload: {
          totalCount: beneficiariesData.length,
          successCount: results.success.length,
          failedCount: results.failed.length,
        },
      },
      activeSession,
    );

    return BaseService.success(results);
  }, session);
};

/**
 * Process AI evaluation result
 */
export const processAIEvaluationResult = async (
  beneficiaryId,
  aiResult,
  session = null,
) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(activeSession);

    if (!beneficiary) {
      throw new AppError("Beneficiary not found", 404);
    }

    // Update AI decision
    beneficiary.aiDecision = {
      eligibilityConfidence: aiResult.eligibilityConfidence,
      fraudRisk: aiResult.fraudRisk,
      decision: aiResult.decision,
      flags: aiResult.flags || [],
      reason: aiResult.reason,
      evaluatedAt: new Date(),
    };

    // Update risk score
    beneficiary.riskScore = aiResult.fraudRisk;

    // Determine status transition based on AI decision
    if (aiResult.decision === "BLOCK") {
      beneficiary.status = BENEFICIARY_STATUS.BLOCKED;
    } else if (aiResult.decision === "MANUAL_REVIEW") {
      beneficiary.status = BENEFICIARY_STATUS.UNDER_REVIEW;
      // Add high priority flag in metadata
      beneficiary.metadata = {
        ...beneficiary.metadata,
        highPriority: true,
      };
    } else if (
      aiResult.decision === "ALLOW" ||
      aiResult.decision === "ALLOW_WITH_MONITORING"
    ) {
      beneficiary.status = BENEFICIARY_STATUS.UNDER_REVIEW;
    }

    addVerificationHistory(beneficiary, "AI_EVALUATED", null, aiResult.reason);

    await beneficiary.save({ session: activeSession });

    // Create audit log
    await createBeneficiaryAuditLog(
      beneficiary,
      AUDIT_EVENTS.BENEFICIARY_AI_EVALUATED,
      { _id: "SYSTEM", role: "SYSTEM" },
      {
        aiDecision: aiResult.decision,
        eligibilityConfidence: aiResult.eligibilityConfidence,
        fraudRisk: aiResult.fraudRisk,
        flags: aiResult.flags,
      },
      activeSession,
    );

    return BaseService.updated(beneficiary);
  }, session);
};

/**
 * Get high-risk beneficiaries (Admin only)
 */
export const getHighRiskBeneficiaries = async (filters = {}) => {
  const query = {
    $or: [{ riskScore: { $gt: 70 } }, { "aiDecision.decision": "BLOCK" }],
  };

  if (filters.campaign) {
    query.campaign = filters.campaign;
  }

  if (filters.ngo) {
    const campaigns = await Campaign.find({ ngo: filters.ngo }).select("_id");
    const campaignIds = campaigns.map((c) => c._id);
    query.campaign = { $in: campaignIds };
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const beneficiaries = await Beneficiary.find(query)
    .populate("campaign", "title ngo")
    .populate("campaign.ngo", "name email")
    .sort({ riskScore: -1 })
    .lean();

  return BaseService.success(beneficiaries);
};

/**
 * Admin block beneficiary
 */
export const adminBlockBeneficiary = async (
  beneficiaryId,
  adminId,
  reason,
  session = null,
) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(activeSession);

    if (!beneficiary) {
      throw new AppError("Beneficiary not found", 404);
    }

    // Validate reason
    if (!reason || reason.length < 10) {
      throw new AppError("Block reason must be at least 10 characters", 400);
    }

    beneficiary.status = BENEFICIARY_STATUS.BLOCKED;

    addVerificationHistory(beneficiary, "BLOCKED", adminId, reason);

    await beneficiary.save({ session: activeSession });

    // Create audit log
    await createBeneficiaryAuditLog(
      beneficiary,
      AUDIT_EVENTS.BENEFICIARY_BLOCKED,
      { _id: adminId, role: "ADMIN" },
      { blockReason: reason },
      activeSession,
    );

    // Send notification (async, outside transaction)
    if (!session) {
      await sendBeneficiaryNotification(
        beneficiary,
        NOTIFICATION_TYPES.BENEFICIARY_BLOCKED,
        {},
      );
    }

    return BaseService.updated(beneficiary);
  }, session);
};

/**
 * Admin override approval
 */
export const adminOverrideApproval = async (
  beneficiaryId,
  adminId,
  reason,
  session = null,
) => {
  return withTransaction(async (txSession) => {
    const activeSession = session || txSession;

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(activeSession);

    if (!beneficiary) {
      throw new AppError("Beneficiary not found", 404);
    }

    // Validate AI decision is BLOCK
    if (beneficiary.aiDecision?.decision !== "BLOCK") {
      throw new AppError(
        "Admin override only allowed for AI-blocked beneficiaries",
        400,
      );
    }

    // Validate reason
    if (!reason || reason.length < 10) {
      throw new AppError("Override reason must be at least 10 characters", 400);
    }

    beneficiary.status = BENEFICIARY_STATUS.APPROVED;
    beneficiary.overrideByNgo = {
      decision: "APPROVED",
      reason: `Admin override: ${reason}`,
      ngo: adminId,
      at: new Date(),
    };

    addVerificationHistory(
      beneficiary,
      "APPROVED",
      adminId,
      `Admin override: ${reason}`,
    );

    await beneficiary.save({ session: activeSession });

    // Create audit log
    await createBeneficiaryAuditLog(
      beneficiary,
      AUDIT_EVENTS.BENEFICIARY_APPROVED,
      { _id: adminId, role: "ADMIN" },
      { overrideReason: reason, adminOverride: true },
      activeSession,
    );

    // Send notification (async, outside transaction)
    if (!session) {
      const campaign = await Campaign.findById(beneficiary.campaign);
      await sendBeneficiaryNotification(
        beneficiary,
        NOTIFICATION_TYPES.BENEFICIARY_APPROVED,
        { campaignName: campaign?.title || "the campaign" },
      );
    }

    return BaseService.updated(beneficiary);
  }, session);
};

/**
 * Get beneficiary statistics
 */
export const getBeneficiaryStatistics = async (ngoId, filters = {}) => {
  // Get NGO's campaigns
  const campaigns = await Campaign.find({ ngo: ngoId }).select("_id");
  const campaignIds = campaigns.map((c) => c._id);

  const query = { campaign: { $in: campaignIds } };

  if (filters.campaign) {
    query.campaign = filters.campaign;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  // Count by status
  const total = await Beneficiary.countDocuments(query);
  const pending = await Beneficiary.countDocuments({
    ...query,
    status: BENEFICIARY_STATUS.PENDING,
  });
  const underReview = await Beneficiary.countDocuments({
    ...query,
    status: BENEFICIARY_STATUS.UNDER_REVIEW,
  });
  const approved = await Beneficiary.countDocuments({
    ...query,
    $or: [
      { status: BENEFICIARY_STATUS.APPROVED },
      { status: BENEFICIARY_STATUS.NGO_APPROVED },
    ],
  });
  const rejected = await Beneficiary.countDocuments({
    ...query,
    $or: [
      { status: BENEFICIARY_STATUS.REJECTED },
      { status: BENEFICIARY_STATUS.NGO_REJECTED },
    ],
  });
  const blocked = await Beneficiary.countDocuments({
    ...query,
    status: BENEFICIARY_STATUS.BLOCKED,
  });

  // Calculate approval rate
  const totalReviewed = approved + rejected;
  const approvalRate =
    totalReviewed > 0 ? ((approved / totalReviewed) * 100).toFixed(2) : 0;

  return BaseService.success({
    total,
    pending,
    underReview,
    approved,
    rejected,
    blocked,
    approvalRate: parseFloat(approvalRate),
  });
};
