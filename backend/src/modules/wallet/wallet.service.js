import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Merchant } from "../../models/merchant/Merchant.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { AppError } from "../../utils/AppError.js";
import { BaseService } from "../../core/base.service.js";
import { withTransaction } from "../../core/transaction.js";
import {
  WALLET_STATUS,
  WALLET_ERROR_CODES,
  AUDIT_EVENT_TYPES,
} from "./wallet.constants.js";
import policyEngine from "../../engines/policy.engine.js";
import { addFraudCheckJob } from "../../jobs/fraud.job.js";
import { createAuditLog } from "../audit/audit.service.js";
import { generateHash } from "../../utils/hash.util.js";
import { createNotification } from "../notification/notification.service.js";

/*
CREATE WALLET
called after NGO assigns donation to beneficiary
*/
export const createWallet = async (data) => {
  return withTransaction(async (session) => {
    // Check beneficiary approval status
    const beneficiary = await Beneficiary.findById(data.beneficiaryId).session(
      session,
    );
    if (!beneficiary) {
      throw new AppError(WALLET_ERROR_CODES.BENEFICIARY_NOT_FOUND, 404);
    }
    if (beneficiary.status !== "APPROVED") {
      throw new AppError(WALLET_ERROR_CODES.BENEFICIARY_NOT_APPROVED, 400);
    }

    // Check for existing wallet (idempotency via natural key)
    const existingWallet = await Wallet.findOne({
      beneficiary: data.beneficiaryId,
      campaign: data.campaignId,
    }).session(session);

    if (existingWallet) {
      return existingWallet;
    }

    // Get campaign for policy snapshot
    const campaign = await Campaign.findById(data.campaignId).session(session);
    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    // Generate jobIdHash
    const jobIdHash =
      data.jobIdHash ||
      generateHash({
        type: "WALLET",
        beneficiary: data.beneficiaryId?.toString(),
        campaign: data.campaignId?.toString(),
        timestamp: Date.now(),
      });

    // Calculate expiry date
    const validityDays = campaign.policySnapshot?.validityDays || 14;
    const expiresAt = new Date(Date.now() + validityDays * 86400000);

    // Create wallet with complete policy snapshot
    const wallet = await Wallet.create(
      [
        {
          beneficiary: data.beneficiaryId,
          campaign: data.campaignId,
          donation: data.donation || null,
          createdBy: data.createdBy,
          balance: data.amount,
          initialAmount: data.amount,
          jobIdHash,
          policy: {
            allowedCategories: campaign.policySnapshot?.allowedCategories || [
              "FOOD",
              "MEDICINE",
              "SHELTER",
            ],
            maxPerTransaction:
              campaign.policySnapshot?.maxPerTransaction || 1000,

            // dailyLimit and weeklyLimit don't exist on Campaign.policySnapshot
            // (Campaign only has maxPerTransaction and maxPerBeneficiary).
            // Derive sensible per-wallet limits from real campaign policy fields:
            // daily limit = 5x maxPerTransaction, capped at maxPerBeneficiary
            // weekly limit = the beneficiary's full per-campaign allocation
            dailyLimit: Math.min(
              (campaign.policySnapshot?.maxPerTransaction || 1000) * 5,
              campaign.policySnapshot?.maxPerBeneficiary || 5000,
            ),
            weeklyLimit: campaign.policySnapshot?.maxPerBeneficiary || 5000,

            expiresAt,
            allowedMerchants: [],
            maxDistanceKm: 50,
            allowedDistricts: [],
          },
          status: WALLET_STATUS.ACTIVE,
        },
      ],
      { session },
    );

    // Update campaign metrics
    await Campaign.findByIdAndUpdate(
      data.campaignId,
      {
        $inc: {
          totalAllocated: data.amount,
          totalWalletsCreated: 1,
        },
      },
      { session },
    );

    // Create audit log
    await createAuditLog(
      {
        eventType: AUDIT_EVENT_TYPES.WALLET_CREATED,
        entityType: "Wallet",
        entityId: wallet[0]._id,
        actorRole: "NGO",
        actorId: data.createdBy,
        payload: {
          beneficiaryId: data.beneficiaryId,
          campaignId: data.campaignId,
          initialAmount: data.amount,
        },
      },
      session,
    );

    // Send notification
    try {
      await createNotification({
        userId: beneficiary.user,
        role: "BENEFICIARY",
        type: "WALLET_CREATED",
        title: "Wallet Created",
        message: `Your wallet has been created with balance ₹${wallet[0].balance}`,
        entityType: "Wallet",
        entityId: wallet[0]._id.toString(),
        channels: ["IN_APP", "SMS"],
        priority: "HIGH",
      });
    } catch (error) {
      // Log but don't fail wallet creation
      console.error("Failed to send wallet created notification:", error);
    }

    return wallet[0];
  });
};

/*
SPEND WALLET
beneficiary uses relief funds at merchant
*/
export const spendWallet = async (beneficiaryId, data) => {
  return withTransaction(async (session) => {
    const wallet = await Wallet.findById(data.walletId).session(session);

    if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);
    if (wallet.status !== WALLET_STATUS.ACTIVE)
      throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_ACTIVE, 400);
    if (wallet.balance < data.amount)
      throw new AppError(WALLET_ERROR_CODES.INSUFFICIENT_BALANCE, 400);

    const merchant = await Merchant.findById(data.merchantId).session(session);
    if (!merchant || merchant.status !== "ACTIVE")
      throw new AppError(WALLET_ERROR_CODES.INVALID_MERCHANT, 400);

    const beneficiary =
      await Beneficiary.findById(beneficiaryId).session(session);
    if (!beneficiary)
      throw new AppError(WALLET_ERROR_CODES.BENEFICIARY_NOT_FOUND, 404);

    // Calculate distance
    let distance = null;
    if (beneficiary?.location?.lat && merchant?.location?.lat) {
      distance = policyEngine.calculateDistance(
        beneficiary.location.lat,
        beneficiary.location.lng,
        merchant.location.lat,
        merchant.location.lng,
      );
    }

    // Comprehensive policy validation
    try {
      policyEngine.validateTransaction(wallet.policy, {
        category: data.category,
        merchantId: merchant._id,
        amount: data.amount,
        todaySpent: wallet.dailySpent || 0,
        weekSpent: wallet.weeklySpent || 0,
        walletExpiry: wallet.policy.expiresAt,
        beneficiaryLocation: beneficiary.location,
        merchantLocation: merchant.location,
        merchantDistrict: merchant.location?.district,
      });
    } catch (error) {
      throw new AppError(error.message, 403);
    }

    // Deduct balance and update counters
    wallet.balance -= data.amount;
    wallet.totalSpent = (wallet.totalSpent || 0) + data.amount;
    wallet.dailySpent = (wallet.dailySpent || 0) + data.amount;
    wallet.weeklySpent = (wallet.weeklySpent || 0) + data.amount;
    wallet.transactionCount = (wallet.transactionCount || 0) + 1;
    wallet.lastTransactionAt = new Date();

    // Append transaction record with metadata
    wallet.transactions.push({
      type: "DEBIT",
      amount: data.amount,
      category: data.category,
      merchant: merchant._id,
      merchantName: merchant.shopName,
      balanceAfter: wallet.balance,
      timestamp: new Date(),
      metadata: {
        beneficiaryLocation: beneficiary.location,
        merchantLocation: merchant.location,
        distance,
        deviceId: data.deviceId,
        ipAddress: data.ipAddress,
      },
    });

    await wallet.save({ session });

    // Update merchant settlement balance
    await Merchant.findByIdAndUpdate(
      data.merchantId,
      {
        $inc: {
          pendingBalance: data.amount,
          totalAidProcessed: data.amount,
          transactionCount: 1,
        },
        $set: {
          lastTransactionAt: new Date(),
        },
      },
      { session },
    );

    // Update campaign metrics
    await Campaign.findByIdAndUpdate(
      wallet.campaign,
      {
        $inc: {
          totalSpent: data.amount,
        },
      },
      { session },
    );

    // Enqueue fraud check job (async)
    try {
      await addFraudCheckJob({
        entityType: "wallet",
        entityId: wallet._id,
        signals: {
          amount: data.amount,
          merchantId: merchant._id,
          beneficiaryId,
          category: data.category,
          location: data.location,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to enqueue fraud check:", error);
    }

    // Create audit log
    await createAuditLog(
      {
        eventType: AUDIT_EVENT_TYPES.WALLET_SPENT,
        entityType: "Wallet",
        entityId: wallet._id,
        actorRole: "BENEFICIARY",
        payload: {
          amount: data.amount,
          merchant: merchant.shopName,
          category: data.category,
        },
      },
      session,
    );

    // Check for low balance and send notification
    if (wallet.balance < wallet.initialAmount * 0.2) {
      try {
        await createNotification({
          userId: beneficiary.user,
          role: "BENEFICIARY",
          type: "LOW_BALANCE",
          title: "Low Wallet Balance",
          message: `Your wallet balance is low: ₹${wallet.balance} (${Math.round((wallet.balance / wallet.initialAmount) * 100)}% remaining)`,
          entityType: "Wallet",
          entityId: wallet._id.toString(),
          channels: ["IN_APP", "SMS"],
          priority: "NORMAL",
        });
      } catch (error) {
        console.error("Failed to send low balance notification:", error);
      }
    }

    return BaseService.updated(wallet);
  });
};

/*
CREDIT WALLET
NGO adds funds to existing wallet
*/
export const creditWallet = async (walletId, amount, ngoUserId) => {
  return withTransaction(async (session) => {
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);
    if (wallet.status !== WALLET_STATUS.ACTIVE)
      throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_ACTIVE, 400);
    if (amount <= 0) throw new AppError(WALLET_ERROR_CODES.INVALID_AMOUNT, 400);

    // Increment balance
    wallet.balance += amount;

    // Append transaction record
    wallet.transactions.push({
      type: "CREDIT",
      amount,
      balanceAfter: wallet.balance,
      timestamp: new Date(),
      metadata: {
        creditedBy: ngoUserId,
      },
    });

    await wallet.save({ session });

    // Update campaign metrics
    await Campaign.findByIdAndUpdate(
      wallet.campaign,
      {
        $inc: {
          totalAllocated: amount,
        },
      },
      { session },
    );

    // Create audit log
    await createAuditLog(
      {
        eventType: AUDIT_EVENT_TYPES.WALLET_CREDITED,
        entityType: "Wallet",
        entityId: wallet._id,
        actorRole: "NGO",
        actorId: ngoUserId,
        payload: { amount },
      },
      session,
    );

    // Send notification
    try {
      const beneficiary = await Beneficiary.findById(wallet.beneficiary);
      if (beneficiary) {
        await createNotification({
          userId: beneficiary.user,
          role: "BENEFICIARY",
          type: "WALLET_CREDITED",
          title: "Wallet Credited",
          message: `₹${amount} has been added to your wallet. New balance: ₹${wallet.balance}`,
          entityType: "Wallet",
          entityId: wallet._id.toString(),
          channels: ["IN_APP", "SMS"],
          priority: "NORMAL",
        });
      }
    } catch (error) {
      console.error("Failed to send wallet credited notification:", error);
    }

    return BaseService.updated(wallet);
  });
};

/*
ADJUST WALLET
Admin makes balance adjustment
*/
export const adjustWallet = async (walletId, amount, reason, adminId) => {
  return withTransaction(async (session) => {
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);

    // Prevent negative balance
    if (wallet.balance + amount < 0) {
      throw new AppError(WALLET_ERROR_CODES.INVALID_ADJUSTMENT, 400);
    }

    // Update balance
    wallet.balance += amount;

    // Append transaction record
    wallet.transactions.push({
      type: "ADJUSTMENT",
      amount,
      balanceAfter: wallet.balance,
      timestamp: new Date(),
      metadata: {
        adjustmentReason: reason,
        adjustedBy: adminId,
      },
    });

    await wallet.save({ session });

    // Create audit log
    await createAuditLog(
      {
        eventType: AUDIT_EVENT_TYPES.WALLET_ADJUSTED,
        entityType: "Wallet",
        entityId: wallet._id,
        actorRole: "ADMIN",
        actorId: adminId,
        payload: { amount, reason },
      },
      session,
    );

    // Send notification
    try {
      const beneficiary = await Beneficiary.findById(wallet.beneficiary);
      if (beneficiary) {
        await createNotification({
          userId: beneficiary.user,
          role: "BENEFICIARY",
          type: "WALLET_ADJUSTED",
          title: "Wallet Balance Adjusted",
          message: `Your wallet balance has been adjusted by ₹${amount}. Reason: ${reason}. New balance: ₹${wallet.balance}`,
          entityType: "Wallet",
          entityId: wallet._id.toString(),
          channels: ["IN_APP", "SMS"],
          priority: "HIGH",
        });
      }
    } catch (error) {
      console.error("Failed to send wallet adjusted notification:", error);
    }

    return BaseService.updated(wallet);
  });
};

/*
CLOSE WALLET
Admin closes wallet
*/
export const closeWallet = async (walletId, reason, adminId) => {
  return withTransaction(async (session) => {
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);

    // Verify wallet status is ACTIVE or EXPIRED
    if (
      wallet.status !== WALLET_STATUS.ACTIVE &&
      wallet.status !== WALLET_STATUS.EXPIRED
    ) {
      throw new AppError(WALLET_ERROR_CODES.INVALID_STATE_TRANSITION, 400);
    }

    // Transition to CLOSED
    wallet.status = WALLET_STATUS.CLOSED;
    wallet.closedBy = adminId;
    wallet.closedAt = new Date();
    wallet.closeReason = reason;
    wallet.remainingBalanceAtClosure = wallet.balance;

    await wallet.save({ session });

    // Create audit log
    await createAuditLog(
      {
        eventType: AUDIT_EVENT_TYPES.WALLET_CLOSED,
        entityType: "Wallet",
        entityId: wallet._id,
        actorRole: "ADMIN",
        actorId: adminId,
        payload: { reason, remainingBalance: wallet.balance },
      },
      session,
    );

    // Send notification
    try {
      const beneficiary = await Beneficiary.findById(wallet.beneficiary);
      if (beneficiary) {
        await createNotification({
          userId: beneficiary.user,
          role: "BENEFICIARY",
          type: "WALLET_CLOSED",
          title: "Wallet Closed",
          message: `Your wallet has been closed. Reason: ${reason}. Remaining balance: ₹${wallet.balance}`,
          entityType: "Wallet",
          entityId: wallet._id.toString(),
          channels: ["IN_APP", "SMS"],
          priority: "HIGH",
        });
      }
    } catch (error) {
      console.error("Failed to send wallet closed notification:", error);
    }

    return BaseService.updated(wallet);
  });
};

/*
FREEZE WALLET
admin or government action
*/
export const freezeWallet = async (walletId, reason, adminId) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);
  if (wallet.status === WALLET_STATUS.SUSPENDED)
    throw new AppError(WALLET_ERROR_CODES.WALLET_ALREADY_FROZEN, 400);

  // Verify wallet status is ACTIVE
  if (wallet.status !== WALLET_STATUS.ACTIVE) {
    throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_ACTIVE, 400);
  }

  wallet.status = WALLET_STATUS.SUSPENDED;
  wallet.freezeReason = reason;
  wallet.frozenBy = adminId;
  wallet.frozenAt = new Date();
  await wallet.save();

  await createAuditLog({
    eventType: AUDIT_EVENT_TYPES.WALLET_FROZEN,
    entityType: "Wallet",
    entityId: wallet._id,
    actorRole: "ADMIN",
    actorId: adminId,
    payload: { reason },
  });

  // Send notification
  try {
    const beneficiary = await Beneficiary.findById(wallet.beneficiary);
    if (beneficiary) {
      await createNotification({
        userId: beneficiary.user,
        role: "BENEFICIARY",
        type: "WALLET_FROZEN",
        title: "Wallet Frozen",
        message: `Your wallet has been frozen. Reason: ${reason}. Please contact support for assistance.`,
        entityType: "Wallet",
        entityId: wallet._id.toString(),
        channels: ["IN_APP", "SMS"],
        priority: "HIGH",
      });
    }
  } catch (error) {
    console.error("Failed to send wallet frozen notification:", error);
  }

  return BaseService.updated(wallet);
};

/*
UNFREEZE WALLET
*/
export const unfreezeWallet = async (walletId, adminId) => {
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);
  if (wallet.status !== WALLET_STATUS.SUSPENDED)
    throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FROZEN, 400);

  wallet.status = WALLET_STATUS.ACTIVE;
  wallet.freezeReason = null;
  await wallet.save();

  await createAuditLog({
    eventType: AUDIT_EVENT_TYPES.WALLET_UNFROZEN,
    entityType: "Wallet",
    entityId: wallet._id,
    actorRole: "ADMIN",
    actorId: adminId,
    payload: { unfrozenBy: adminId },
  });

  return BaseService.updated(wallet);
};

/*
GET WALLET BY BENEFICIARY USER ID
looks up beneficiary record first, then wallet
*/
export const getWalletByUserId = async (userId) => {
  const beneficiary = await Beneficiary.findOne({ user: userId });
  if (!beneficiary)
    throw new AppError(WALLET_ERROR_CODES.BENEFICIARY_NOT_FOUND, 404);

  const wallet = await Wallet.findOne({ beneficiary: beneficiary._id })
    .populate("campaign", "title disasterType location")
    .populate("beneficiary", "name");

  if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);

  return BaseService.success(wallet);
};

/*
GET WALLET TRANSACTIONS
*/
export const getWalletTransactions = async (userId, options = {}) => {
  const { page = 1, limit = 50 } = options;

  const beneficiary = await Beneficiary.findOne({ user: userId });
  if (!beneficiary)
    throw new AppError(WALLET_ERROR_CODES.BENEFICIARY_NOT_FOUND, 404);

  const wallet = await Wallet.findOne({ beneficiary: beneficiary._id });
  if (!wallet) throw new AppError(WALLET_ERROR_CODES.WALLET_NOT_FOUND, 404);

  // Sort transactions by timestamp descending and paginate
  const transactions = wallet.transactions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice((page - 1) * limit, page * limit);

  return BaseService.success({
    transactions,
    pagination: {
      page,
      limit,
      total: wallet.transactions.length,
    },
  });
};
