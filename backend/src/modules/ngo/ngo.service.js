import { Donation } from "../../models/donor/Donation.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { createWallet } from "../wallet/wallet.service.js";
import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";
import { createAuditLog } from "../audit/audit.service.js";
import { generateHash } from "../../utils/hash.util.js";

/*
NGO DASHBOARD STATS
*/
export const getNgoDashboard = async (ngoId) => {
  const campaigns = await Campaign.find({ createdBy: ngoId });
  const campaignIds = campaigns.map((c) => c._id);

  const [
    totalCampaigns,
    activeCampaigns,
    totalBeneficiaries,
    activeBeneficiaries,
    pendingBeneficiaries,
    pendingDonations,
    donationVolume,
  ] = await Promise.all([
    Campaign.countDocuments({ createdBy: ngoId }),
    Campaign.countDocuments({ createdBy: ngoId, status: "ACTIVE" }),
    Beneficiary.countDocuments({ campaign: { $in: campaignIds } }),
    Beneficiary.countDocuments({ campaign: { $in: campaignIds }, status: "ACTIVE" }),
    Beneficiary.countDocuments({ campaign: { $in: campaignIds }, status: { $in: ["REGISTERED", "AI_EVALUATED", "MANUAL_REVIEW"] } }),
    Donation.countDocuments({ campaign: { $in: campaignIds }, status: "PENDING_NGO_REVIEW" }),
    Donation.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return BaseService.success({
    totalCampaigns,
    activeCampaigns,
    totalBeneficiaries,
    activeBeneficiaries,
    pendingBeneficiaries,
    pendingDonations,
    totalDonated: donationVolume[0]?.total || 0,
  });
};

/*
GET PENDING DONATIONS FOR NGO
donations in PENDING_NGO_REVIEW or HIGH_RISK_ESCALATED for NGO's campaigns
*/
export const getPendingDonations = async (ngoId) => {
  const campaigns = await Campaign.find({ createdBy: ngoId }).select("_id");
  const campaignIds = campaigns.map((c) => c._id);

  const donations = await Donation.find({
    campaign: { $in: campaignIds },
    status: { $in: ["PENDING_NGO_REVIEW", "HIGH_RISK_ESCALATED", "PAYMENT_SUCCESS"] },
  })
    .populate("donor", "name email")
    .populate("campaign", "title disasterType policySnapshot")
    .sort({ createdAt: -1 });

  return BaseService.success(donations);
};

/*
GET NGO BENEFICIARIES (all campaigns or filtered)
*/
export const getNgoBeneficiaries = async (ngoId, query = {}) => {
  const campaigns = await Campaign.find({ createdBy: ngoId }).select("_id");
  const campaignIds = campaigns.map((c) => c._id);

  const filter = { campaign: { $in: campaignIds } };
  if (query.status) filter.status = query.status;

  const beneficiaries = await Beneficiary.find(filter)
    .populate("campaign", "title disasterType")
    .sort({ createdAt: -1 });

  return BaseService.success(beneficiaries);
};

/*
ASSIGN DONATION TO BENEFICIARY
sets donation.beneficiary — prerequisite before approval
*/
export const assignDonationToBeneficiary = async (donationId, beneficiaryId, ngoId) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  // Verify NGO owns this campaign
  if (donation.campaign.createdBy.toString() !== ngoId.toString()) {
    throw new AppError("Unauthorized: not your campaign", 403);
  }

  if (!["PENDING_NGO_REVIEW", "HIGH_RISK_ESCALATED", "PAYMENT_SUCCESS"].includes(donation.status)) {
    throw new AppError("Donation is not in a reviewable state", 400);
  }

  const beneficiary = await Beneficiary.findById(beneficiaryId);
  if (!beneficiary) throw new AppError("Beneficiary not found", 404);
  if (beneficiary.status !== "ACTIVE" && beneficiary.status !== "NGO_APPROVED") {
    throw new AppError("Beneficiary must be approved before receiving funds", 400);
  }

  donation.beneficiary = beneficiaryId;
  await donation.save();

  return BaseService.updated(donation);
};

/*
APPROVE DONATION — creates wallet for beneficiary
*/
export const approveDonation = async (donationId, ngoId) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.campaign.createdBy.toString() !== ngoId.toString()) {
    throw new AppError("Unauthorized: not your campaign", 403);
  }

  if (!donation.beneficiary) {
    throw new AppError("Assign a beneficiary before approving", 400);
  }

  if (!["PENDING_NGO_REVIEW", "HIGH_RISK_ESCALATED", "PAYMENT_SUCCESS"].includes(donation.status)) {
    throw new AppError("Donation is not in a reviewable state", 400);
  }

  // Create wallet for beneficiary
  const wallet = await createWallet({
    beneficiary: donation.beneficiary,
    campaign: donation.campaign._id,
    donation: donation._id,
    amount: donation.amount,
    policy: donation.policySnapshot || donation.campaign.policySnapshot,
    jobIdHash: generateHash({
      type: "WALLET_FROM_DONATION",
      donationId: donation._id.toString(),
      timestamp: Date.now(),
    }),
  });

  donation.status = "READY_FOR_USE";
  donation.wallet = wallet._id;
  donation.walletCreated = true;
  await donation.save();

  // Update campaign stats
  await Campaign.updateOne(
    { _id: donation.campaign._id },
    { $inc: { totalAllocated: donation.amount, totalWalletsCreated: 1 } }
  );

  // Update beneficiary status to ACTIVE
  await Beneficiary.findByIdAndUpdate(donation.beneficiary, { status: "ACTIVE" });

  await createAuditLog({
    eventType: "DONATION_NGO_APPROVED",
    entityType: "Donation",
    entityId: donation._id,
    actorRole: "NGO",
    payload: { walletId: wallet._id, beneficiaryId: donation.beneficiary, amount: donation.amount },
  });

  return BaseService.updated({ donation, wallet });
};

/*
REJECT DONATION
*/
export const rejectDonation = async (donationId, ngoId, reason) => {
  const donation = await Donation.findById(donationId).populate("campaign");
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.campaign.createdBy.toString() !== ngoId.toString()) {
    throw new AppError("Unauthorized: not your campaign", 403);
  }

  donation.status = "REJECTED";
  donation.reviewReason = reason || "Rejected by NGO";
  await donation.save();

  await createAuditLog({
    eventType: "DONATION_NGO_REJECTED",
    entityType: "Donation",
    entityId: donation._id,
    actorRole: "NGO",
    payload: { reason },
  });

  return BaseService.updated(donation);
};

/*
GET NGO CAMPAIGNS
*/
export const getNgoCampaigns = async (ngoId) => {
  const campaigns = await Campaign.find({ createdBy: ngoId }).sort({ createdAt: -1 });
  return BaseService.success(campaigns);
};

/*
ALLOCATE DONATION TO BENEFICIARY (legacy — kept for workflow engine)
*/
export const allocateDonationToBeneficiary = async (ngoId, data) => {
  await assignDonationToBeneficiary(data.donationId, data.beneficiaryId, ngoId);
  return approveDonation(data.donationId, ngoId);
};
