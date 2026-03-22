import { asyncHandler } from "../../core/asyncHandler.js";

import * as walletService from "./wallet.service.js";

export const spendWallet = asyncHandler(async (req, res) => {
  const result = await walletService.spendWallet(
    req.user._id,

    req.body,
  );

  res.json(result);
});

export const getMyWallet = asyncHandler(async (req, res) => {
  const result = await walletService.getWallet(req.user._id);

  res.json(result);
});

export const freezeWallet = asyncHandler(async (req, res) => {
  const result = await walletService.freezeWallet(
    req.params.id,

    req.body.reason,

    req.user._id,
  );

  res.json(result);
});
