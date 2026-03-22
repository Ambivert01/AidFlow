import { User } from "../../models/User.model.js";
import { Wallet } from "../../models/Wallet.model.js";
import { Merchant } from "../../models/Merchant.model.js";
import { FraudAlert } from "../../models/FraudAlert.model.js";

import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";

export const approveUser = async (userId, adminId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.verificationStatus = "APPROVED";

  user.approvedBy = adminId;

  await user.save();

  return BaseService.updated(user);
};

export const freezeWallet = async (walletId, reason, adminId) => {
  const wallet = await Wallet.findById(walletId);

  wallet.status = "FROZEN";

  wallet.freezeReason = reason;

  wallet.frozenBy = adminId;

  await wallet.save();

  return BaseService.updated(wallet);
};

export const banMerchant = async (merchantId, reason) => {
  const merchant = await Merchant.findById(merchantId);

  merchant.status = "BANNED";

  merchant.suspendedReason = reason;

  await merchant.save();

  return BaseService.updated(merchant);
};

export const getFraudAlerts = async () => {
  const alerts = await FraudAlert.find({
    status: "OPEN",
  });

  return BaseService.success(alerts);
};
