import { asyncHandler } from "../../core/asyncHandler.js";
import * as ngoService from "./ngo.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const result = await ngoService.getNgoDashboard(req.user._id);
  res.json(result);
});

export const getPendingDonations = asyncHandler(async (req, res) => {
  const result = await ngoService.getPendingDonations(req.user._id);
  res.json(result);
});

export const getNgoBeneficiaries = asyncHandler(async (req, res) => {
  const result = await ngoService.getNgoBeneficiaries(req.user._id, req.query);
  res.json(result);
});

export const assignDonation = asyncHandler(async (req, res) => {
  const result = await ngoService.assignDonationToBeneficiary(
    req.params.id,
    req.body.beneficiaryId,
    req.user._id
  );
  res.json(result);
});

export const approveDonation = asyncHandler(async (req, res) => {
  const result = await ngoService.approveDonation(req.params.id, req.user._id);
  res.json(result);
});

export const rejectDonation = asyncHandler(async (req, res) => {
  const result = await ngoService.rejectDonation(req.params.id, req.user._id, req.body.reason);
  res.json(result);
});

export const getMyCampaigns = asyncHandler(async (req, res) => {
  const result = await ngoService.getNgoCampaigns(req.user._id);
  res.json(result);
});

export const allocateDonation = asyncHandler(async (req, res) => {
  const result = await ngoService.allocateDonationToBeneficiary(req.user._id, req.body);
  res.json(result);
});

export const getCampaignBeneficiaries = asyncHandler(async (req, res) => {
  const result = await ngoService.getNgoBeneficiaries(req.user._id, { ...req.query, campaignId: req.params.campaignId });
  res.json(result);
});
