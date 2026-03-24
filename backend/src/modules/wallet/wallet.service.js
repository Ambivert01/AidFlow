import { Wallet } from "../../models/Wallet.model.js";

import { Merchant } from "../../models/Merchant.model.js";

import { AppError } from "../../utils/AppError.js";

import { BaseService } from "../../core/base.service.js";

import { withTransaction } from "../../core/transaction.js";

import { WALLET_STATUS } from "./wallet.constants.js";

import { addFraudCheckJob } from "../../jobs/fraud.job.js";

import { Beneficiary } from "../../models/Beneficiary.model.js";

import policyEngine from "../../engines/policy.engine.js";

import { createSettlementRecord } from "../settlement/settlement.service.js";

import workflowEngine from "../../engines/workflow.engine.js";

export const createWallet = async (data) => {
  const wallet = await Wallet.create({
    beneficiary: data.beneficiary,

    campaign: data.campaign,

    balance: data.amount,

    policy: {
      ...data.policy,

      expiresAt: new Date(Date.now() + data.policy.validityDays * 86400000),
    },

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

    // // category validation

    // if (!wallet.policy.allowedCategories.includes(data.category)) {
    //   throw new AppError("Category not allowed", 400);
    // }

    // // per transaction limit

    // if (data.amount > wallet.policy.maxPerTransaction) {
    //   throw new AppError("Exceeds per transaction limit", 400);
    // }

    // merchant validation

    const merchant = await Merchant.findById(data.merchantId);

    if (!merchant || merchant.status !== "ACTIVE") {
      throw new AppError("Invalid merchant", 400);
    }

    // GEO VALIDATION

    // example simple distance check (km)
    const calculateDistance = (loc1, loc2) => {
      const toRad = (v) => (v * Math.PI) / 180;

      const R = 6371;

      const dLat = toRad(loc2.lat - loc1.lat);

      const dLon = toRad(loc2.lng - loc1.lng);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(loc1.lat)) *
          Math.cos(toRad(loc2.lat)) *
          Math.sin(dLon / 2) ** 2;

      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    // fetch beneficiary

    const beneficiary = await Beneficiary.findById(beneficiaryId);

    if (beneficiary?.location?.lat && merchant?.location?.lat) {
      const distance = calculateDistance(
        beneficiary.location,
        merchant.location,
      );

      if (distance > 50) {
        throw new AppError("Merchant too far from beneficiary location", 400);
      }
    }

    policyEngine.validateTransaction(
      wallet.policy,

      {
        category: data.category,
        merchantId: data.merchantId,
        amount: data.amount,
        todaySpent: 0,
        walletExpiry: wallet.policy.expiresAt,
        lat: beneficiary?.location?.lat,
        lng: beneficiary?.location?.lng,
      },
    );

    // deduct balance

    wallet.balance -= data.amount;

    wallet.transactions.push({
      type: "DEBIT",

      amount: data.amount,

      category: data.category,

      merchant: merchant._id,

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

  await createAuditLog({
    eventType: "WALLET_FROZEN",

    entityId: wallet._id,

    actorRole: "ADMIN",

    payload: { reason },
  });

  await workflowEngine.handleTransactionCompleted({
    id: wallet._id,

    amount: data.amount,
  });

  return BaseService.updated(wallet);
};
