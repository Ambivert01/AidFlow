import { Merchant } from "../../models/Merchant.model.js";

import { AppError } from "../../utils/AppError.js";

import { BaseService } from "../../core/base.service.js";

import { MERCHANT_STATUS } from "./merchant.constants.js";

export const registerMerchant = async (userId, data) => {
  const merchant = await Merchant.create({
    user: userId,

    shopName: data.shopName,

    category: data.category,

    location: data.location,

    status: MERCHANT_STATUS.PENDING,
  });

  return BaseService.created(merchant);
};

export const approveMerchant = async (merchantId, adminId) => {
  const merchant = await Merchant.findById(merchantId);

  if (!merchant) {
    throw new AppError("Merchant not found", 404);
  }

  merchant.status = MERCHANT_STATUS.ACTIVE;

  merchant.approvedBy = adminId;

  await merchant.save();

  return BaseService.updated(merchant);
};

export const suspendMerchant = async (merchantId, reason) => {
  const merchant = await Merchant.findById(merchantId);

  merchant.status = MERCHANT_STATUS.SUSPENDED;

  merchant.suspendedReason = reason;

  await merchant.save();

  return BaseService.updated(merchant);
};

export const getActiveMerchants = async () => {
  const merchants = await Merchant.find({
    status: MERCHANT_STATUS.ACTIVE,
  });

  return BaseService.success(merchants);
};

export const getMerchantProfile = async (userId) => {
  const merchant = await Merchant.findOne({
    user: userId,
  });

  if (!merchant) {
    throw new AppError("Merchant not found", 404);
  }

  return BaseService.success(merchant);
};
