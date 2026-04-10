import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import * as beneficiaryService from "./beneficiary.service.js";

export const registerBeneficiary = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.registerBeneficiary(req.user._id, req.body);
  res.status(201).json(result);
});

export const approveBeneficiary = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.approveBeneficiaryByNGO(req.params.id, req.user._id);
  res.json(result);
});

export const getCampaignBeneficiaries = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.getCampaignBeneficiaries(req.params.campaignId);
  res.json(result);
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.getMyBeneficiaryProfile(req.user._id);
  res.json(result);
});

export const appealDecision = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.appealDecision(req.params.id, req.body.reason);
  res.json(ApiResponse.updated(result));
});

export const bulkUpload = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.bulkUpload(req.body.list);
  res.status(201).json(ApiResponse.created(result));
});
