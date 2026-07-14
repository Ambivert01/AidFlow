import { asyncHandler } from "../../core/asyncHandler.js";

import * as settlementService from "./settlement.service.js";

export const processSettlement = asyncHandler(async (req, res) => {
  const result = await settlementService.processSettlement(req.params.id);

  res.json(result);
});

export const createSettlementForMerchant = asyncHandler(async (req, res) => {
  const result = await settlementService.createSettlementForMerchant(
    req.params.merchantId,
  );

  res.json(result);
});

export const getMySettlements = asyncHandler(async (req, res) => {
  const result = await settlementService.getMerchantSettlements(req.user._id);

  res.json(result);
});

export const getAllSettlements = asyncHandler(async (req, res) => {
  const result = await settlementService.getAllSettlements();

  res.json(result);
});
