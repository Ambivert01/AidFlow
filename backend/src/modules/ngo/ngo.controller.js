import { asyncHandler } from "../../core/asyncHandler.js";

import * as ngoService from "./ngo.service.js";

export const allocateDonation = asyncHandler(async (req, res) => {
  const result = await ngoService.allocateDonationToBeneficiary(
    req.user._id,

    req.body,
  );

  res.json(result);
});

export const getMyCampaigns = asyncHandler(async (req, res) => {
  const result = await ngoService.getNgoCampaigns(req.user._id);

  res.json(result);
});

export const getCampaignBeneficiaries = asyncHandler(async (req, res) => {
  const result = await ngoService.getNgoBeneficiaries(
    req.user._id,

    req.params.campaignId,
  );

  res.json(result);
});
