import { Beneficiary } from "../../models/Beneficiary.model.js";

import { AppError } from "../../utils/AppError.js";

import { BaseService } from "../../core/base.service.js";

import { withTransaction } from "../../core/transaction.js";

import { BENEFICIARY_STATUS } from "./beneficiary.constants.js";

import { addAIDecisionJob } from "../../jobs/ai.job.js";

export const registerBeneficiary = async (userId, data) => {
  return withTransaction(async (session) => {
    const beneficiary = await Beneficiary.create(
      [
        {
          user: userId,

          campaign: data.campaignId,

          name: data.name,

          phone: data.phone,

          familySize: data.familySize,

          displacementStatus: data.displacementStatus,

          location: data.location,

          status: BENEFICIARY_STATUS.REGISTERED,
        },
      ],

      { session },
    );

    // AI eligibility check (async)

    await addAIDecisionJob({
      type: "BENEFICIARY_ELIGIBILITY",

      beneficiaryId: beneficiary[0]._id,
    });

    return BaseService.created(beneficiary[0]);
  });
};

export const approveBeneficiaryByNGO = async (beneficiaryId, ngoId) => {
  const beneficiary = await Beneficiary.findById(beneficiaryId);

  if (!beneficiary) {
    throw new AppError("Beneficiary not found", 404);
  }

  beneficiary.status = BENEFICIARY_STATUS.NGO_APPROVED;

  await beneficiary.save();

  return BaseService.updated(beneficiary);
};

export const getCampaignBeneficiaries = async (campaignId) => {
  const beneficiaries = await Beneficiary.find({
    campaign: campaignId,
  });

  return BaseService.success(beneficiaries);
};

export const getMyBeneficiaryProfile = async (userId) => {
  const beneficiary = await Beneficiary.findOne({
    user: userId,
  });

  if (!beneficiary) {
    throw new AppError("Beneficiary profile not found", 404);
  }

  return BaseService.success(beneficiary);
};

export const appealDecision = async (id, reason) => {
  const beneficiary = await Beneficiary.findById(id);

  beneficiary.status = "MANUAL_REVIEW";

  beneficiary.appealReason = reason;

  await beneficiary.save();

  return beneficiary;
};

export const bulkUpload = async (list) => {
  const inserted = [];

  for (const b of list) {
    inserted.push(await Beneficiary.create(b));
  }

  return inserted;
};
