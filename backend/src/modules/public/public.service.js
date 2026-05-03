import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { Proof } from "../../models/proofs/Proof.model.js";
import { User } from "../../models/auth/User.model.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { FraudAlert } from "../../models/governance/FraudAlert.model.js";
import { BaseService } from "../../core/base.service.js";

/**
 * Get public homepage statistics
 * Aggregates data from multiple collections
 */
export const getPublicStats = async () => {
  try {
    // Run all aggregations in parallel for performance
    const [
      totalDonationsResult,
      totalProofsResult,
      verifiedProofsResult,
      activeNGOsResult,
      fraudDetectedResult,
      blockchainAnchoredResult,
    ] = await Promise.all([
      // Total donations count and sum
      Donation.aggregate([
        { $match: { paymentStatus: "SUCCESS" } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),

      // Total proofs count
      Proof.countDocuments(),

      // Verified proofs count
      Proof.countDocuments({ status: { $in: ["AI_VERIFIED", "APPROVED"] } }),

      // Active NGOs count
      User.countDocuments({
        role: "NGO",
        verificationStatus: "APPROVED",
        isActive: true,
      }),

      // Fraud detected count
      FraudAlert.countDocuments({
        status: { $in: ["OPEN", "CONFIRMED_FRAUD"] },
      }),

      // Blockchain anchored count
      AuditLog.countDocuments({
        "blockchainAnchor.txHash": { $exists: true, $ne: null },
      }),
    ]);

    const donationData = totalDonationsResult[0] || {
      count: 0,
      totalAmount: 0,
    };

    return BaseService.success({
      totalDonations: donationData.count,
      totalDonationAmount: donationData.totalAmount,
      totalProofs: totalProofsResult,
      verifiedProofs: verifiedProofsResult,
      activeNGOs: activeNGOsResult,
      fraudDetected: fraudDetectedResult,
      blockchainAnchored: blockchainAnchoredResult,
      lastUpdated: new Date(),
    });
  } catch (error) {
    // Return empty stats on error instead of failing
    return BaseService.success({
      totalDonations: 0,
      totalDonationAmount: 0,
      totalProofs: 0,
      verifiedProofs: 0,
      activeNGOs: 0,
      fraudDetected: 0,
      blockchainAnchored: 0,
      lastUpdated: new Date(),
    });
  }
};

/**
 * Get public campaigns (top active campaigns)
 */
export const getPublicCampaigns = async (limit = 6) => {
  const campaigns = await Campaign.find({ status: "ACTIVE" })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .select(
      "title description disasterType targetAmount totalDonated location transparencyScore proofCount createdAt",
    );

  return BaseService.success(campaigns);
};

/**
 * Get recent public transactions (for transparency)
 */
export const getRecentTransactions = async (limit = 10) => {
  const donations = await Donation.find({ paymentStatus: "SUCCESS" })
    .populate("campaign", "title disasterType")
    .populate("donor", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("amount jobIdHash status createdAt campaign donor isAnonymous");

  // Format for public display (hide sensitive info)
  const formattedTransactions = donations.map((donation) => ({
    id: donation._id,
    amount: donation.amount,
    campaign: donation.campaign?.title || "Unknown Campaign",
    disasterType: donation.campaign?.disasterType || "OTHER",
    donor: donation.isAnonymous
      ? "Anonymous Donor"
      : donation.donor?.name || "Anonymous",
    status: donation.status,
    hash: donation.jobIdHash.substring(0, 16) + "...", // Show partial hash
    fullHash: donation.jobIdHash,
    timestamp: donation.createdAt,
  }));

  return BaseService.success(formattedTransactions);
};

/**
 * Get blockchain status (for transparency indicator)
 */
export const getBlockchainStatus = async () => {
  try {
    // Get latest blockchain anchor
    const latestAnchor = await AuditLog.findOne({
      "blockchainAnchor.txHash": { $exists: true, $ne: null },
    })
      .sort({ "blockchainAnchor.anchoredAt": -1 })
      .select("blockchainAnchor merkleRoot");

    if (!latestAnchor) {
      return BaseService.success({
        status: "PENDING",
        message: "No blockchain anchors yet",
        latestAnchor: null,
      });
    }

    return BaseService.success({
      status: "ACTIVE",
      message: "Blockchain anchoring operational",
      latestAnchor: {
        txHash: latestAnchor.blockchainAnchor.txHash,
        merkleRoot: latestAnchor.merkleRoot,
        anchoredAt: latestAnchor.blockchainAnchor.anchoredAt,
        blockNumber: latestAnchor.blockchainAnchor.blockNumber,
      },
    });
  } catch (error) {
    return BaseService.success({
      status: "UNKNOWN",
      message: "Unable to fetch blockchain status",
      latestAnchor: null,
    });
  }
};

/**
 * Get campaign by ID (public view)
 */
export const getPublicCampaignById = async (id) => {
  const campaign = await Campaign.findById(id)
    .populate("createdBy", "name")
    .select(
      "title description disasterType targetAmount totalDonated totalAllocated totalSpent location transparencyScore proofCount proofVerifiedCount totalBeneficiaries beneficiariesServed status createdAt",
    );

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return BaseService.success(campaign);
};
