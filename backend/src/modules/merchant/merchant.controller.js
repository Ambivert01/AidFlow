import { asyncHandler } from "../../core/asyncHandler.js";

import * as merchantService from "./merchant.service.js";

export const registerMerchant = asyncHandler(async (req, res) => {
  const result = await merchantService.registerMerchant(
    req.user._id,

    req.body,
  );

  res.status(201).json(result);
});

export const approveMerchant = asyncHandler(async (req, res) => {
  const result = await merchantService.approveMerchant(
    req.params.id,

    req.user._id,
  );

  res.json(result);
});

export const suspendMerchant = asyncHandler(async (req, res) => {
  const result = await merchantService.suspendMerchant(
    req.params.id,

    req.body.reason,
  );

  res.json(result);
});

export const getMerchants = asyncHandler(async (req, res) => {
  const result = await merchantService.getActiveMerchants();

  res.json(result);
});

export const getMyMerchantProfile = asyncHandler(async (req, res) => {
  const result = await merchantService.getMerchantProfile(req.user._id);

  res.json(result);
});
