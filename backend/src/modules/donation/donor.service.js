import { Donation } from "../../models/donor/Donation.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { BaseService } from "../../core/base.service.js";

/*
DONOR DASHBOARD STATS
*/
export const getDonorDashboard = async (userId) => {
  const donations = await Donation.find({ donor: userId });

  const totalDonated = donations.reduce((s, d) => s + d.amount, 0);
  const totalDonations = donations.length;
  const activeDonations = donations.filter((d) => d.status === "READY_FOR_USE").length;
  const campaignIds = [...new Set(donations.map((d) => d.campaign?.toString()))];

  return BaseService.success({
    totalDonated,
    totalDonations,
    activeDonations,
    campaignsSupported: campaignIds.length,
  });
};

/*
GET DONOR DONATIONS (populated)
*/
export const getDonorDonations = async (userId) => {
  const donations = await Donation.find({ donor: userId })
    .populate("campaign", "title disasterType location")
    .sort({ createdAt: -1 });

  // Shape response for frontend
  const shaped = donations.map((d) => ({
    donationId: d._id,
    _id: d._id,
    campaign: d.campaign,
    amount: d.amount,
    status: d.status,
    aiDecision: d.aiDecision?.decision || null,
    aiRiskScore: d.aiDecision?.riskScore || null,
    auditFinalized: d.auditFinalized,
    createdAt: d.createdAt,
    jobIdHash: d.jobIdHash,
  }));

  return BaseService.success(shaped);
};
