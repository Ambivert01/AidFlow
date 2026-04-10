import { asyncHandler } from "../../core/asyncHandler.js";
import { ApiResponse } from "../../core/apiResponse.js";
import * as donorService from "./donor.service.js";

export const getDonorDashboard = asyncHandler(async (req, res) => {
  const result = await donorService.getDonorDashboard(req.user._id);
  res.json(result);
});

export const getDonorDonations = asyncHandler(async (req, res) => {
  const result = await donorService.getDonorDonations(req.user._id);
  res.json(result);
});
