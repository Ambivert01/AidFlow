import { asyncHandler } from "../../core/asyncHandler.js";

import { ApiResponse } from "../../core/apiResponse.js";

import * as campaignService from "./campaign.service.js";

export const createCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.createCampaign(
    req.user._id,

    req.body,
  );

  res.status(201).json(result);
});

export const activateCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.activateCampaign(
    req.params.id,

    req.user._id,
  );

  res.json(result);
});

export const getCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.getCampaignById(req.params.id);

  res.json(result);
});

export const getActiveCampaigns = asyncHandler(async (req, res) => {
  const result = await campaignService.getAllActiveCampaigns();

  res.json(result);
});
