import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Merchant } from "../../models/merchant/Merchant.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { AppError } from "../../utils/AppError.js";
import { BaseService } from "../../core/base.service.js";
import { withTransaction } from "../../core/transaction.js";
import { WALLET_STATUS } from "./wallet.constants.js";
import policyEngine from "../../engines/policy.engine.js";
import { addFraudCheckJob } from "../../jobs/fraud.job.js";
import { createAuditLog } from "../audit/audit.service.js";
import { generateHash } from "../../utils/hash.util.js";

/*
CREATE WALLET
called after NGO assigns donation to beneficiary
*/
export const createWallet = async (data) => {
  const jobIdHash = data.jobIdHash || generateHash({
    type: "WALLET",
    beneficiary: data.beneficiary?.toString(),
    campaign: data.campaign?.toString(),
    timestamp: Date.now(),
  });

  const wallet = await Wallet.create({
    beneficiary: data.beneficiary,
    campaign: data.campaign,
    donation: data.donation || null,
    balance: data.amount,
    initialAmount: data.amount,
    jobIdHash,
    policy: {
      ...data.policy,
      expiresAt: new Date(Date.now() + (data.policy?.validityDays || 14) * 86400000),
    },
    status: WALLET_STATUS.ACTIVE,
  });

  return wallet;
};

/*
SPEND WALLET
beneficiary uses relief funds at merchant
*/
export const spendWallet = async (beneficiaryId, data) => {
  return withTransaction(async (session) => {
    const wallet = await Wallet.findById(data.walletId).session(session);

    if (!wallet) throw new AppError("Wallet not found", 404);
    if (wallet.status !== WALLET_STATUS.ACTIVE) throw new AppError("Wallet not active", 400);
    if (wallet.balance < data.amount) throw new AppError("Insufficient balance", 400);

    const merchant = await Merchant.findById(data.merchantId).session(session);
    if (!merchant || merchant.status !== "ACTIVE") throw new AppError("Invalid merchant", 400);

    // Policy: category check
    if (!wallet.policy.allowedCategories.includes(data.category)) {
      throw new AppError("Category not allowed under this relief policy", 400);
    }

    // Policy: per-transaction limit
    if (data.amount > wallet.policy.maxPerTransaction) {
      throw new AppError("Amount exceeds per transaction limit", 400);
    }

    // Policy: daily limit
    if ((wallet.dailySpent || 0) + data.amount > (wallet.policy.dailyLimit || Infinity)) {
      throw new AppError("Daily spending limit exceeded", 400);
    }

    // Policy: expiry
    if (wallet.policy.expiresAt && new Date() > new Date(wallet.policy.expiresAt)) {
      throw new AppError("Wallet has expired", 400);
    }

    // Geo check: merchant should be near beneficiary
    const beneficiary = await Beneficiary.findById(beneficiaryId).session(session);
    if (beneficiary?.location?.lat && merchant?.location?.lat) {
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(merchant.location.lat - beneficiary.location.lat);
      const dLon = toRad(merchant.location.lng - beneficiary.location.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(beneficiary.location.lat)) *
          Math.cos(toRad(merchant.location.lat)) *
          Math.sin(dLon / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distance > 50) throw new AppError("Merchant too far from beneficiary location", 400);
    }

    // Deduct balance
    wallet.balance -= data.amount;
    wallet.totalSpent = (wallet.totalSpent || 0) + data.amount;
    wallet.dailySpent = (wallet.dailySpent || 0) + data.amount;
    wallet.transactionCount = (wallet.transactionCount || 0) + 1;
    wallet.lastTransactionAt = new Date();

    // Ledger entry
    wallet.transactions.push({
      type: "DEBIT",
      amount: data.amount,
      category: data.category,
      merchant: merchant._id,
      merchantName: merchant.shopName,
      balanceAfter: wallet.balance,
      timestamp: new Date(),
    });

    await wallet.save({ session });

    // Async fraud check
    await addFraudCheckJob({
      entityType: "wallet",
      entityId: wallet._id,
      signals: { amount: data.amount, merchantId: merchant._id, beneficiaryId },
    });

    await createAuditLog({
      eventType: "WALLET_SPENT",
      entityType: "Wallet",
      entityId: wallet._id,
      actorRole: "BENEFICIARY",
      payload: { amount: data.amount, merchant: merchant.shopName, category: data.category },
    });

    return BaseService.updated(wallet);
  });
};

/*
GET WALLET BY BENEFICIARY USER ID
looks up beneficiary record first, then wallet
*/
export const getWalletByUserId = async (userId) => {
  const beneficiary = await Beneficiary.findOne({ user: userId });
  if (!beneficiary) throw new AppError("Beneficiary profile not found", 404);

  const wallet = await Wallet.findOne({ beneficiary: beneficiary._id })
    .populate("campaign", "title disasterType location")
    .populate("beneficiary", "name");

  if (!wallet) throw new AppError("No active wallet found", 404);

  return BaseService.success(wallet);
};

/*
GET WALLET TRANSACTIONS
*/
export const getWalletTransactions = async (userId) => {
  const beneficiary = await Beneficiary.findOne({ user: userId });
  if (!beneficiary) throw new AppError("Beneficiary profile not found", 404);

  const wallet = await Wallet.findOne({ beneficiary: beneficiary._id });
  if (!wallet) throw new AppError("No wallet found", 404);

  return BaseService.success(wallet.transactions || []);
};

/*
FREEZE WALLET
admin or government action
*/
export const freezeWallet = async (walletId, reason, adminId) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError("Wallet not found", 404);
  if (wallet.status === WALLET_STATUS.FROZEN) throw new AppError("Wallet already frozen", 400);

  wallet.status = WALLET_STATUS.FROZEN;
  wallet.freezeReason = reason;
  wallet.frozenBy = adminId;
  wallet.frozenAt = new Date();
  await wallet.save();

  await createAuditLog({
    eventType: "WALLET_FROZEN",
    entityType: "Wallet",
    entityId: wallet._id,
    actorRole: "ADMIN",
    payload: { reason },
  });

  return BaseService.updated(wallet);
};

/*
UNFREEZE WALLET
*/
export const unfreezeWallet = async (walletId, adminId) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError("Wallet not found", 404);
  if (wallet.status !== WALLET_STATUS.FROZEN) throw new AppError("Wallet is not frozen", 400);

  wallet.status = WALLET_STATUS.ACTIVE;
  wallet.freezeReason = null;
  await wallet.save();

  await createAuditLog({
    eventType: "WALLET_UNFROZEN",
    entityType: "Wallet",
    entityId: wallet._id,
    actorRole: "ADMIN",
    payload: { unfrozenBy: adminId },
  });

  return BaseService.updated(wallet);
};
