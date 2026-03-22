import { Wallet } from "../../models/Wallet.model.js";

import { Merchant } from "../../models/Merchant.model.js";

import { AppError } from "../../utils/AppError.js";

import { BaseService } from "../../core/base.service.js";

import { withTransaction } from "../../core/transaction.js";

import { WALLET_STATUS } from "./wallet.constants.js";

import { addFraudCheckJob } from "../../jobs/fraud.job.js";

export const createWallet = async (data) => {
  const wallet = await Wallet.create({
    beneficiary: data.beneficiary,

    campaign: data.campaign,

    balance: data.amount,

    policy: data.policy,

    status: WALLET_STATUS.ACTIVE,
  });

  return wallet;
};

export const spendWallet = async (beneficiaryId, data) => {
  return withTransaction(async (session) => {
    const wallet = await Wallet.findById(data.walletId);

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    if (wallet.status !== WALLET_STATUS.ACTIVE) {
      throw new AppError("Wallet not active", 400);
    }

    if (wallet.balance < data.amount) {
      throw new AppError("Insufficient balance", 400);
    }

    // category validation

    if (!wallet.policy.allowedCategories.includes(data.category)) {
      throw new AppError("Category not allowed", 400);
    }

    // per transaction limit

    if (data.amount > wallet.policy.maxPerTransaction) {
      throw new AppError("Exceeds per transaction limit", 400);
    }

    // merchant validation

    const merchant = await Merchant.findById(data.merchantId);

    if (!merchant || merchant.status !== "ACTIVE") {
      throw new AppError("Invalid merchant", 400);
    }

    // deduct balance

    wallet.balance -= data.amount;

    wallet.transactions.push({
      type: "DEBIT",

      amount: data.amount,

      category: data.category,

      merchantId: merchant._id,

      merchantName: merchant.shopName,

      balanceAfter: wallet.balance,
    });

    await wallet.save({ session });

    // fraud check async

    await addFraudCheckJob({
      walletId: wallet._id,

      amount: data.amount,
    });

    return BaseService.updated(wallet);
  });
};

export const getWallet = async (beneficiaryId) => {
  const wallet = await Wallet.findOne({
    beneficiary: beneficiaryId,
  });

  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  return BaseService.success(wallet);
};

export const freezeWallet = async (walletId, reason, adminId) => {
  const wallet = await Wallet.findById(walletId);

  wallet.status = WALLET_STATUS.FROZEN;

  wallet.freezeReason = reason;

  wallet.frozenBy = adminId;

  await wallet.save();

  return BaseService.updated(wallet);
};
