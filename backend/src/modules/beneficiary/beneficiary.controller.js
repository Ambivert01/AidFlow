import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import * as beneficiaryService from "./beneficiary.service.js";

// NGO registers beneficiary
export const registerBeneficiary = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.registerBeneficiary(
    req.user._id,
    req.body,
  );
  res.status(201).json(result);
});

// Beneficiary self-applies to a campaign under their own account
export const applyAsBeneficiary = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.applyAsBeneficiary(
    req.user._id,
    req.body,
  );
  res.status(201).json(result);
});

// Get NGO's beneficiaries with filters
export const getNGOBeneficiaries = asyncHandler(async (req, res) => {
  const filters = {
    campaign: req.query.campaign,
    status: req.query.status,
    search: req.query.search,
    minAIScore: req.query.minAIScore,
    maxAIScore: req.query.maxAIScore,
    page: req.query.page,
    limit: req.query.limit,
  };
  const result = await beneficiaryService.getNGOBeneficiaries(
    req.user._id,
    filters,
  );
  res.json(result);
});

// Get beneficiary details
export const getBeneficiaryDetails = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.getBeneficiaryDetails(
    req.params.id,
    req.user._id,
    req.user.role,
  );
  res.json(result);
});

// NGO approves beneficiary
export const approveBeneficiary = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.approveBeneficiaryByNGO(
    req.params.id,
    req.user._id,
  );
  res.json(result);
});

// NGO rejects beneficiary
export const rejectBeneficiary = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.rejectBeneficiaryByNGO(
    req.params.id,
    req.user._id,
    req.body.reason,
  );
  res.json(result);
});

// Beneficiary submits appeal
export const submitAppeal = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.submitAppeal(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.json(result);
});

// Get pending appeals (NGO)
export const getPendingAppeals = asyncHandler(async (req, res) => {
  const filters = {
    status: "MANUAL_REVIEW",
    hasAppeal: true,
  };
  const result = await beneficiaryService.getNGOBeneficiaries(
    req.user._id,
    filters,
  );
  res.json(result);
});

// NGO reviews appeal
export const reviewAppeal = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.reviewAppeal(
    req.params.id,
    req.user._id,
    req.body.decision,
    req.body.reason,
  );
  res.json(result);
});

// Bulk upload beneficiaries
export const bulkUpload = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.bulkUpload(
    req.user._id,
    req.body.beneficiaries,
  );
  res.status(201).json(result);
});

// Get beneficiary statistics (NGO)
export const getBeneficiaryStatistics = asyncHandler(async (req, res) => {
  const filters = {
    campaign: req.query.campaign,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };
  const result = await beneficiaryService.getBeneficiaryStatistics(
    req.user._id,
    filters,
  );
  res.json(result);
});

// Get high-risk beneficiaries (Admin)
export const getHighRiskBeneficiaries = asyncHandler(async (req, res) => {
  const filters = {
    campaign: req.query.campaign,
    ngo: req.query.ngo,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };
  const result = await beneficiaryService.getHighRiskBeneficiaries(filters);
  res.json(result);
});

// Admin blocks beneficiary
export const adminBlockBeneficiary = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.adminBlockBeneficiary(
    req.params.id,
    req.user._id,
    req.body.reason,
  );
  res.json(result);
});

// Admin overrides approval
export const adminOverrideApproval = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.adminOverrideApproval(
    req.params.id,
    req.user._id,
    req.body.reason,
  );
  res.json(result);
});

// Get campaign beneficiaries
export const getCampaignBeneficiaries = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.getCampaignBeneficiaries(
    req.params.campaignId,
  );
  res.json(result);
});

// Get my beneficiary profile
export const getMyProfile = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.getMyBeneficiaryProfile(req.user._id);
  res.json(result);
});

// Legacy appeal decision (deprecated - use submitAppeal instead)
export const appealDecision = asyncHandler(async (req, res) => {
  const result = await beneficiaryService.appealDecision(
    req.params.id,
    req.body.reason,
  );
  res.json(ApiResponse.updated(result));
});
