import { asyncHandler } from "../../core/asyncHandler.js";

import { ApiResponse } from "../../core/apiResponse.js";

import * as donationService from "./donation.service.js";

// Create Donation
export const createDonation = asyncHandler(async (req, res) => {
  const donation = await donationService.createDonation(
    req.user._id,

    req.body,
  );

  res.status(201).json(ApiResponse.created(donation));
});

// Get Donation by ID
export const getDonation = asyncHandler(async (req, res) => {
  const donation = await donationService.getDonationById(req.params.id);

  res.json(ApiResponse.success(donation));
});

// Get My Donations (Donor)
export const getMyDonations = asyncHandler(async (req, res) => {
  const donations = await donationService.getDonorDonations(req.user._id);

  res.json(ApiResponse.success(donations));
});

// NGO Approves Donation
export const approveDonationByNGO = asyncHandler(async (req, res) => {
  const donation = await donationService.approveDonationByNGO(
    req.params.id,

    req.user._id,
  );

  res.json(ApiResponse.updated(donation));
});

// Government Decision
export const governmentDecision = asyncHandler(async (req, res) => {
  const donation = await donationService.governmentDecision(
    req.params.id,

    req.body.decision,

    req.user._id,
  );

  res.json(ApiResponse.updated(donation));
});
