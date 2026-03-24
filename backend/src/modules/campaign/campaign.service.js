import { Campaign } from "../../models/ngo/Campaign.model.js";

import { AppError } from "../../utils/AppError.js";

import { BaseService } from "../../core/base.service.js";

import { withTransaction } from "../../core/transaction.js";

import { CAMPAIGN_STATUS } from "./campaign.constants.js";

export const createCampaign = async (ngoId, data) => {
  return withTransaction(async (session) => {
    const campaign = await Campaign.create(
      [
        {
          title: data.title,

          description: data.description,

          disasterType: data.disasterType,

          location: data.location,

          createdBy: ngoId,

          policySnapshot: {
            allowedCategories: data.policy.allowedCategories,

            maxPerBeneficiary: data.policy.maxPerBeneficiary,

            validityDays: data.policy.validityDays,

            maxPerTransaction: data.policy.maxPerTransaction,
          },

          status: CAMPAIGN_STATUS.DRAFT,
        },
      ],

      { session },
    );

    return BaseService.created(campaign[0]);
  });
};

export const activateCampaign = async (campaignId, ngoId) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (!campaign.createdBy.equals(ngoId)) {
    throw new AppError("Unauthorized", 403);
  }

  campaign.status = CAMPAIGN_STATUS.ACTIVE;

  await campaign.save();

  return BaseService.updated(campaign);
};

export const getCampaignById = async (id) => {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  return BaseService.success(campaign);
};

export const getAllActiveCampaigns = async () => {
  const campaigns = await Campaign.find({
    status: CAMPAIGN_STATUS.ACTIVE,
  });

  return BaseService.success(campaigns);
};
