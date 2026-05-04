import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Proof } from "../../models/proofs/Proof.model.js";
import { AIDecisionLog } from "../../models/system/AIDecisionLog.model.js";
import { FraudAlert } from "../../models/governance/FraudAlert.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { Notification } from "../../models/system/Notification.model.js";

/**
 * Aggregate campaign statistics
 * @param {Array<ObjectId>} campaignIds - Array of campaign IDs
 * @returns {Promise<Object>} Campaign statistics
 */
export const aggregateCampaignStats = async (campaignIds) => {
  try {
    // Fetch all campaigns with their metrics
    const campaigns = await Campaign.find({ _id: { $in: campaignIds } })
      .select(
        "title status targetAmount totalDonated totalAllocated totalSpent " +
          "totalBeneficiaries totalWalletsCreated transparencyScore aiRiskScore " +
          "location disasterType pausedReason closedReason",
      )
      .lean();

    // Calculate aggregate statistics
    const stats = {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === "ACTIVE").length,
      completed: campaigns.filter((c) => c.status === "COMPLETED").length,
      pendingApproval: campaigns.filter((c) => c.status === "PENDING_APPROVAL")
        .length,
      totalDonated: campaigns.reduce(
        (sum, c) => sum + (c.totalDonated || 0),
        0,
      ),
      totalAllocated: campaigns.reduce(
        (sum, c) => sum + (c.totalAllocated || 0),
        0,
      ),
      totalSpent: campaigns.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      remainingFunds: 0, // Will be calculated below
      campaigns: campaigns.map((c) => ({
        _id: c._id,
        title: c.title,
        status: c.status,
        targetAmount: c.targetAmount,
        totalDonated: c.totalDonated || 0,
        fundingProgress:
          c.targetAmount > 0
            ? Math.round((c.totalDonated / c.targetAmount) * 100)
            : 0,
        beneficiaryCount: c.totalBeneficiaries || 0,
        transparencyScore: c.transparencyScore || 0,
        aiRiskScore: c.aiRiskScore || 0,
        location: c.location,
        disasterType: c.disasterType,
        totalAllocated: c.totalAllocated || 0,
        totalSpent: c.totalSpent || 0,
        walletCount: c.totalWalletsCreated || 0,
        highRisk: (c.aiRiskScore || 0) > 70,
        pausedReason: c.pausedReason || null,
        closedReason: c.closedReason || null,
      })),
    };

    // Calculate remaining funds
    stats.remainingFunds = stats.totalDonated - stats.totalSpent;

    return stats;
  } catch (error) {
    console.error("Error aggregating campaign stats:", error);
    throw error;
  }
};

/**
 * Aggregate beneficiary statistics
 * @param {Array<ObjectId>} campaignIds - Array of campaign IDs
 * @returns {Promise<Object>} Beneficiary statistics
 */
export const aggregateBeneficiaryStats = async (campaignIds) => {
  try {
    // Use aggregation pipeline for efficient counting
    const statusCounts = await Beneficiary.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const aiDecisionCounts = await Beneficiary.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: "$aiDecision.decision",
          count: { $sum: 1 },
        },
      },
    ]);

    // Count high-risk beneficiaries
    const highRiskCount = await Beneficiary.countDocuments({
      campaign: { $in: campaignIds },
      riskScore: { $gt: 70 },
    });

    // Count fraud-flagged beneficiaries
    const fraudFlaggedCount = await Beneficiary.countDocuments({
      campaign: { $in: campaignIds },
      fraudFlags: { $exists: true, $ne: [] },
    });

    // Build status distribution object
    const byStatus = {};
    statusCounts.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    // Build AI decision distribution object
    const byAIDecision = {};
    aiDecisionCounts.forEach((item) => {
      if (item._id) {
        byAIDecision[item._id] = item.count;
      }
    });

    // Calculate totals
    const total = statusCounts.reduce((sum, item) => sum + item.count, 0);

    return {
      total,
      approved: byStatus.APPROVED || byStatus.NGO_APPROVED || 0,
      pending: (byStatus.PENDING || 0) + (byStatus.UNDER_REVIEW || 0),
      rejected: (byStatus.REJECTED || 0) + (byStatus.NGO_REJECTED || 0),
      manualReview: byStatus.MANUAL_REVIEW || 0,
      fraudFlagged: fraudFlaggedCount,
      highRisk: highRiskCount,
      byStatus,
      byAIDecision,
    };
  } catch (error) {
    console.error("Error aggregating beneficiary stats:", error);
    throw error;
  }
};

/**
 * Aggregate wallet statistics
 * @param {Array<ObjectId>} campaignIds - Array of campaign IDs
 * @returns {Promise<Object>} Wallet statistics
 */
export const aggregateWalletStats = async (campaignIds) => {
  try {
    // Aggregate wallet metrics
    const walletMetrics = await Wallet.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: null,
          totalCreated: { $sum: 1 },
          totalAllocated: { $sum: "$initialAmount" },
          totalSpent: { $sum: "$totalSpent" },
          remainingBalance: { $sum: "$balance" },
        },
      },
    ]);

    // Count wallets by status
    const statusCounts = await Wallet.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Count high-risk wallets
    const highRiskCount = await Wallet.countDocuments({
      campaign: { $in: campaignIds },
      riskScore: { $gt: 70 },
    });

    // Per-campaign breakdown
    const byCampaign = await Wallet.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: "$campaign",
          allocated: { $sum: "$initialAmount" },
          spent: { $sum: "$totalSpent" },
        },
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "_id",
          foreignField: "_id",
          as: "campaignInfo",
        },
      },
      {
        $unwind: "$campaignInfo",
      },
      {
        $project: {
          campaignId: "$_id",
          campaignTitle: "$campaignInfo.title",
          allocated: 1,
          spent: 1,
        },
      },
    ]);

    // Spending by category
    const byCategory = await Wallet.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      { $unwind: "$transactions" },
      { $match: { "transactions.type": "DEBIT" } },
      {
        $group: {
          _id: "$transactions.category",
          total: { $sum: "$transactions.amount" },
        },
      },
    ]);

    // Build status counts object
    const statusMap = {};
    statusCounts.forEach((item) => {
      statusMap[item._id.toLowerCase()] = item.count;
    });

    // Build category spending object
    const categoryMap = {};
    byCategory.forEach((item) => {
      if (item._id) {
        categoryMap[item._id] = item.total;
      }
    });

    const metrics = walletMetrics[0] || {
      totalCreated: 0,
      totalAllocated: 0,
      totalSpent: 0,
      remainingBalance: 0,
    };

    return {
      totalCreated: metrics.totalCreated,
      totalAllocated: metrics.totalAllocated,
      totalSpent: metrics.totalSpent,
      remainingBalance: metrics.remainingBalance,
      active: statusMap.active || 0,
      suspended: statusMap.suspended || 0,
      expired: statusMap.expired || 0,
      highRisk: highRiskCount,
      byCampaign,
      byCategory: categoryMap,
    };
  } catch (error) {
    console.error("Error aggregating wallet stats:", error);
    throw error;
  }
};

/**
 * Aggregate proof statistics
 * @param {Array<ObjectId>} campaignIds - Array of campaign IDs
 * @returns {Promise<Object>} Proof statistics
 */
export const aggregateProofStats = async (campaignIds) => {
  try {
    // Count proofs by status
    const statusCounts = await Proof.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Count proofs by type
    const typeCounts = await Proof.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: "$proofType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Count high-risk proofs (fraud probability > 0.7)
    const highRiskCount = await Proof.countDocuments({
      campaign: { $in: campaignIds },
      "aiValidation.fraudProbability": { $gt: 0.7 },
    });

    // Fetch recent proofs
    const recentProofs = await Proof.find({ campaign: { $in: campaignIds } })
      .select("proofType status capturedAt manualReview.reason")
      .sort({ capturedAt: -1 })
      .limit(10)
      .lean();

    // Build status counts object
    const statusMap = {};
    statusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    // Build type counts object
    const typeMap = {};
    typeCounts.forEach((item) => {
      typeMap[item._id] = item.count;
    });

    const total = statusCounts.reduce((sum, item) => sum + item.count, 0);

    return {
      total,
      pending: (statusMap.UPLOADED || 0) + (statusMap.UNDER_VALIDATION || 0),
      aiVerified: statusMap.AI_VERIFIED || 0,
      approved: statusMap.APPROVED || 0,
      rejected: statusMap.REJECTED || 0,
      manualReview: (statusMap.FLAGGED || 0) + (statusMap.MANUAL_REVIEW || 0),
      highRisk: highRiskCount,
      byType: typeMap,
      recent: recentProofs.map((p) => ({
        _id: p._id,
        proofType: p.proofType,
        status: p.status,
        capturedAt: p.capturedAt,
        rejectionReason: p.manualReview?.reason || null,
      })),
    };
  } catch (error) {
    console.error("Error aggregating proof stats:", error);
    throw error;
  }
};

/**
 * Aggregate AI insights (decisions and fraud alerts)
 * @param {Array<ObjectId>} campaignIds - Array of campaign IDs
 * @returns {Promise<Object>} AI insights
 */
export const aggregateAIInsights = async (campaignIds) => {
  try {
    // Count active fraud alerts by severity
    const alertsBySeverity = await FraudAlert.aggregate([
      {
        $match: {
          campaign: { $in: campaignIds },
          status: "OPEN",
        },
      },
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
    ]);

    // Fetch critical alerts
    const criticalAlerts = await FraudAlert.find({
      campaign: { $in: campaignIds },
      status: "OPEN",
      severity: { $in: ["CRITICAL", "HIGH"] },
    })
      .select(
        "alertType entityType entityId severity aiDetection.riskScore status",
      )
      .sort({ severity: -1, createdAt: -1 })
      .limit(20)
      .lean();

    // Fetch recent AI decisions
    const recentDecisions = await AIDecisionLog.find({
      campaign: { $in: campaignIds },
    })
      .select("decisionType decision riskScore reason evaluatedAt")
      .sort({ evaluatedAt: -1 })
      .limit(100)
      .lean();

    // Count AI decisions by type
    const decisionsByType = await AIDecisionLog.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      {
        $group: {
          _id: "$decisionType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Build severity distribution object
    const severityMap = {};
    alertsBySeverity.forEach((item) => {
      severityMap[item._id] = item.count;
    });

    // Build decision type distribution object
    const decisionTypeMap = {};
    decisionsByType.forEach((item) => {
      decisionTypeMap[item._id] = item.count;
    });

    const activeFraudAlerts = alertsBySeverity.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    return {
      activeFraudAlerts,
      alertsBySeverity: severityMap,
      recentDecisions: recentDecisions.map((d) => ({
        _id: d._id,
        decisionType: d.decisionType,
        decision: d.decision,
        riskScore: d.riskScore || 0,
        reason: d.reason || "",
        evaluatedAt: d.evaluatedAt,
      })),
      criticalAlerts: criticalAlerts.map((a) => ({
        _id: a._id,
        alertType: a.alertType,
        entityType: a.entityType,
        entityId: a.entityId,
        severity: a.severity,
        riskScore: a.aiDetection?.riskScore || 0,
        status: a.status,
      })),
      decisionsByType: decisionTypeMap,
    };
  } catch (error) {
    console.error("Error aggregating AI insights:", error);
    throw error;
  }
};

/**
 * Aggregate blockchain anchoring status
 * @param {Array<ObjectId>} campaignIds - Array of campaign IDs
 * @returns {Promise<Object>} Blockchain status
 */
export const aggregateBlockchainStatus = async (campaignIds) => {
  try {
    // Count anchored transactions
    const anchoredCount = await AuditLog.countDocuments({
      campaignId: { $in: campaignIds },
      "blockchainAnchor.txHash": { $exists: true, $ne: null },
    });

    // Count pending anchor transactions
    const pendingCount = await AuditLog.countDocuments({
      campaignId: { $in: campaignIds },
      finalizedAt: { $exists: true, $ne: null },
      "blockchainAnchor.txHash": null,
    });

    // Get last anchor timestamp
    const lastAnchor = await AuditLog.findOne({
      campaignId: { $in: campaignIds },
      "blockchainAnchor.anchoredAt": { $exists: true, $ne: null },
    })
      .select("blockchainAnchor.anchoredAt blockchainAnchor.chain")
      .sort({ "blockchainAnchor.anchoredAt": -1 })
      .lean();

    // Per-campaign anchored count
    const byCampaign = await AuditLog.aggregate([
      {
        $match: {
          campaignId: { $in: campaignIds },
          "blockchainAnchor.txHash": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$campaignId",
          anchoredCount: { $sum: 1 },
        },
      },
      {
        $project: {
          campaignId: "$_id",
          anchoredCount: 1,
          _id: 0,
        },
      },
    ]);

    // Recent blockchain transactions
    const recentTransactions = await AuditLog.find({
      campaignId: { $in: campaignIds },
      "blockchainAnchor.txHash": { $exists: true, $ne: null },
    })
      .select(
        "blockchainAnchor.txHash blockchainAnchor.blockNumber blockchainAnchor.anchoredAt",
      )
      .sort({ "blockchainAnchor.anchoredAt": -1 })
      .limit(10)
      .lean();

    // Check for delay warning (> 24 hours since last anchor)
    const delayWarning = lastAnchor
      ? Date.now() -
          new Date(lastAnchor.blockchainAnchor.anchoredAt).getTime() >
        24 * 60 * 60 * 1000
      : false;

    return {
      totalAnchored: anchoredCount,
      pendingAnchor: pendingCount,
      lastAnchorTimestamp: lastAnchor?.blockchainAnchor?.anchoredAt || null,
      networkName: lastAnchor?.blockchainAnchor?.chain || "N/A",
      byCampaign,
      recentTransactions: recentTransactions.map((tx) => ({
        txHash: tx.blockchainAnchor.txHash,
        blockNumber: tx.blockchainAnchor.blockNumber,
        anchoredAt: tx.blockchainAnchor.anchoredAt,
      })),
      delayWarning,
    };
  } catch (error) {
    console.error("Error aggregating blockchain status:", error);
    throw error;
  }
};

/**
 * Aggregate notifications for NGO user
 * @param {ObjectId} ngoId - NGO user ID
 * @returns {Promise<Array>} Notifications
 */
export const aggregateNotifications = async (ngoId) => {
  try {
    const notifications = await Notification.find({
      recipient: ngoId,
      role: "NGO",
    })
      .select("type title message priority isRead createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return notifications.map((n) => ({
      _id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));
  } catch (error) {
    console.error("Error aggregating notifications:", error);
    throw error;
  }
};
