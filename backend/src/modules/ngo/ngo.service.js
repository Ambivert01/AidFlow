import { Donation } from "../../models/donor/Donation.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";

import { createWallet } from "../wallet/wallet.service.js";

import { BaseService } from "../../core/base.service.js";

import { AppError } from "../../utils/AppError.js";

import workflowEngine from "../../engines/workflow.engine.js";

export const allocateDonationToBeneficiary = async (ngoId, data) => {
  const donation = await Donation.findById(data.donationId);

  if (!donation) {
    throw new AppError("Donation not found", 404);
  }

  if (donation.status !== "NGO_APPROVED") {
    throw new AppError("Donation not ready for allocation", 400);
  }

  const beneficiary = await Beneficiary.findById(data.beneficiaryId);

  if (!beneficiary) {
    throw new AppError("Beneficiary not found", 404);
  }

  // create wallet

  const wallet = await workflowEngine.handleBeneficiaryVerified({
    id: beneficiary._id,

    campaignId: donation.campaign,

    amount: donation.amount,

    policy: donation.policySnapshot,
  });

  donation.beneficiary = beneficiary._id;

  donation.status = "READY_FOR_USE";

  await donation.save();

  return BaseService.success({
    donation,
    wallet,
  });
};

export const getNgoCampaigns = async (ngoId) => {
  const campaigns = await Campaign.find({
    createdBy: ngoId,
  });

  return BaseService.success(campaigns);
};

export const getNgoBeneficiaries = async (ngoId, campaignId) => {
  const beneficiaries = await Beneficiary.find({
    campaign: campaignId,
  });

  return BaseService.success(beneficiaries);
};
