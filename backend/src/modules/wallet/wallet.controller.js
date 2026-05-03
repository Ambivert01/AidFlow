import { asyncHandler } from "../../core/asyncHandler.js";
import * as walletService from "./wallet.service.js";

export const createWallet = asyncHandler(async (req, res) => {
  const result = await walletService.createWallet({
    ...req.body,
    createdBy: req.user._id,
  });
  res.status(201).json({
    success: true,
    data: result,
  });
});

export const spendWallet = asyncHandler(async (req, res) => {
  const result = await walletService.spendWallet(req.user._id, req.body);
  res.json(result);
});

export const creditWallet = asyncHandler(async (req, res) => {
  const result = await walletService.creditWallet(
    req.params.walletId,
    req.body.amount,
    req.user._id,
  );
  res.json(result);
});

export const adjustWallet = asyncHandler(async (req, res) => {
  const result = await walletService.adjustWallet(
    req.params.walletId,
    req.body.amount,
    req.body.reason,
    req.user._id,
  );
  res.json(result);
});

export const closeWallet = asyncHandler(async (req, res) => {
  const result = await walletService.closeWallet(
    req.params.walletId,
    req.body.reason,
    req.user._id,
  );
  res.json(result);
});

export const freezeWallet = asyncHandler(async (req, res) => {
  const result = await walletService.freezeWallet(
    req.params.walletId,
    req.body.reason,
    req.user._id,
  );
  res.json(result);
});

export const unfreezeWallet = asyncHandler(async (req, res) => {
  const result = await walletService.unfreezeWallet(
    req.params.walletId,
    req.user._id,
  );
  res.json(result);
});

export const getMyWallet = asyncHandler(async (req, res) => {
  const result = await walletService.getWalletByUserId(req.user._id);
  res.json(result);
});

export const getMyTransactions = asyncHandler(async (req, res) => {
  const result = await walletService.getWalletTransactions(
    req.user._id,
    req.query,
  );
  res.json(result);
});
