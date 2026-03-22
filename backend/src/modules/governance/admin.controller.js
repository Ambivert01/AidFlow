import { asyncHandler } from "../../core/asyncHandler.js";
import * as adminService from "./admin.service.js";

export const approveUser = asyncHandler(async (req, res) => {
  const result = await adminService.approveUser(
    req.params.id,

    req.user._id,
  );

  res.json(result);
});

export const freezeWallet = asyncHandler(async (req, res) => {
  const result = await adminService.freezeWallet(
    req.params.id,

    req.body.reason,

    req.user._id,
  );

  res.json(result);
});

export const banMerchant = asyncHandler(async (req, res) => {
  const result = await adminService.banMerchant(
    req.params.id,

    req.body.reason,
  );

  res.json(result);
});

export const getFraudAlerts = asyncHandler(async (req, res) => {
  const result = await adminService.getFraudAlerts();

  res.json(result);
});
