import { Campaign } from "../models/Campaign.model.js";
import { Donation } from "../models/Donation.model.js";
import { AuditLog } from "../models/AuditLog.model.js";

export const buildNgoDashboard = async (ngoId) => {
  const campaigns = await Campaign.find({ createdBy: ngoId });

  const campaignIds = campaigns.map(c => c._id);

  const donations = await Donation.find({
    campaign: { $in: campaignIds }
  });

  const audits = await AuditLog.find({
    campaignId: { $in: campaignIds }
  });

  return {
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === "ACTIVE").length,
      draft: campaigns.filter(c => c.status === "DRAFT").length,
      completed: campaigns.filter(c => c.status === "COMPLETED").length,
    },

    donations: {
      total: donations.length,
      pendingReview: donations.filter(d => d.status === "PENDING_NGO_REVIEW").length,
      approved: donations.filter(d => d.status === "READY_FOR_USE").length,
      rejected: donations.filter(d => d.status === "REJECTED_BY_NGO").length,
    },

    audit: {
      totalEvents: audits.length,
      finalized: audits.filter(a => a.merkleRoot).length,
      pending: audits.filter(a => !a.merkleRoot).length,
      anchored: audits.filter(a => a.blockchainTxHash).length,
    }
  };
};
