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

export const getCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.getCampaignById(req.params.id);

  res.json(result);
});

export const getActiveCampaigns = asyncHandler(async (req, res) => {
  const result = await campaignService.getAllActiveCampaigns();

  res.json(result);
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.updateCampaign(
    req.params.id,
    req.user._id,
    req.body,
  );

  res.status(200).json(result);
});

export const submitCampaignForApproval = asyncHandler(async (req, res) => {
  const result = await campaignService.submitCampaignForApproval(
    req.params.id,
    req.user._id,
  );

  res.status(200).json(result);
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.deleteCampaign(
    req.params.id,
    req.user._id,
  );

  res.status(200).json(result);
});

export const pauseCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.pauseCampaign(
    req.params.id,
    req.user._id,
    req.body.reason,
  );

  res.status(200).json(result);
});

export const resumeCampaign = asyncHandler(async (req, res) => {
  const result = await campaignService.resumeCampaign(
    req.params.id,
    req.user._id,
  );

  res.status(200).json(result);
});
