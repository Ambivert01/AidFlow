import jwt from "jsonwebtoken";
import { Wallet } from "../../models/wallet/Wallet.model.js";
import { Merchant } from "../../models/merchant/Merchant.model.js";
import { Beneficiary } from "../../models/beneficiary/Beneficiary.model.js";
import { AppError } from "../../utils/AppError.js";
import { BaseService } from "../../core/base.service.js";
import { spendWallet } from "../wallet/wallet.service.js";
import { createAuditLog } from "../audit/audit.service.js";
import { createNotification } from "../notification/notification.service.js";

import { QR_SECRET } from "../../config/env.config.js";
// SECURITY: QR_SECRET must be a distinct secret from JWT_SECRET. Falling
// back to JWT_SECRET here would mean anyone who can forge an auth token
// could also forge a wallet payment QR token. validateEnv() at startup
// already guarantees QR_SECRET is set and differs from JWT_SECRET.
const QR_EXPIRY = "10m"; // 10 minutes

/*
GENERATE QR TOKEN
beneficiary calls this to get a signed JWT for their wallet
*/
export const generateQRToken = async (userId, walletId) => {
  // Find beneficiary profile
  const beneficiary = await Beneficiary.findOne({ user: userId });
  if (!beneficiary) throw new AppError("Beneficiary profile not found", 404);

  // Find wallet — must belong to this beneficiary
  const wallet = await Wallet.findOne({
    _id: walletId,
    beneficiary: beneficiary._id,
    status: "ACTIVE",
  }).populate("campaign", "title disasterType");

  if (!wallet) throw new AppError("Active wallet not found", 404);

  const payload = {
    walletId: wallet._id.toString(),
    beneficiaryId: beneficiary._id.toString(),
    campaignId: wallet.campaign._id.toString(),
    balance: wallet.balance,
    allowedCategories: wallet.policy.allowedCategories,
    maxPerTransaction: wallet.policy.maxPerTransaction,
    expiresAt: wallet.policy.expiresAt,
    type: "WALLET_QR",
  };

  const qrToken = jwt.sign(payload, QR_SECRET, { expiresIn: QR_EXPIRY });

  return BaseService.success({ qrToken, expiresIn: 600 });
};

/*
SCAN QR TOKEN
merchant scans beneficiary QR — verifies JWT and returns wallet info
*/
export const scanQRToken = async (merchantUserId, qrToken) => {
  // Verify merchant is active
  const merchant = await Merchant.findOne({ user: merchantUserId, status: "ACTIVE" });
  if (!merchant) throw new AppError("Merchant account not active", 403);

  let decoded;
  try {
    decoded = jwt.verify(qrToken, QR_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw new AppError("QR token has expired. Ask beneficiary to regenerate.", 401);
    throw new AppError("Invalid QR token", 401);
  }

  if (decoded.type !== "WALLET_QR") throw new AppError("Invalid token type", 400);

  // Fetch fresh wallet data
  const wallet = await Wallet.findById(decoded.walletId).populate("campaign", "title disasterType");
  if (!wallet) throw new AppError("Wallet not found", 404);
  if (wallet.status !== "ACTIVE") throw new AppError(`Wallet is ${wallet.status}`, 400);

  return BaseService.success({
    walletId: wallet._id,
    beneficiaryId: decoded.beneficiaryId,
    balance: wallet.balance,
    allowedCategories: wallet.policy.allowedCategories,
    maxPerTransaction: wallet.policy.maxPerTransaction,
    campaign: wallet.campaign,
    merchantId: merchant._id,
  });
};

/*
CONFIRM PAYMENT
merchant confirms payment after scanning QR
*/
export const confirmPayment = async (merchantUserId, data) => {
  const merchant = await Merchant.findOne({ user: merchantUserId, status: "ACTIVE" });
  if (!merchant) throw new AppError("Merchant account not active", 403);

  let decoded;
  try {
    decoded = jwt.verify(data.qrToken, QR_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") throw new AppError("QR token expired", 401);
    throw new AppError("Invalid QR token", 401);
  }

  if (decoded.type !== "WALLET_QR") throw new AppError("Invalid token type", 400);

  // Use wallet spend service (handles all policy checks)
  const result = await spendWallet(decoded.beneficiaryId, {
    walletId: decoded.walletId,
    merchantId: merchant._id.toString(),
    amount: data.amount,
    category: data.category,
  });

  const wallet = result.data;

  // Update merchant stats
  await Merchant.updateOne(
    { _id: merchant._id },
    {
      $inc: {
        transactionCount: 1,
        totalRevenue: data.amount,
        totalAidProcessed: data.amount,
        pendingBalance: data.amount,
      },
      $set: { lastTransactionAt: new Date() },
    }
  );

  await createAuditLog({
    eventType: "PAYMENT_CONFIRMED",
    entityType: "Wallet",
    entityId: decoded.walletId,
    actorRole: "MERCHANT",
    payload: {
      merchantId: merchant._id,
      amount: data.amount,
      category: data.category,
      remainingBalance: wallet.balance,
    },
  });

  try {
    const beneficiary = await Beneficiary.findById(decoded.beneficiaryId);
    if (beneficiary?.user) {
      await createNotification({
        userId: beneficiary.user,
        role: "BENEFICIARY",
        type: "TRANSACTION_SUCCESS",
        title: "Payment Successful",
        message: `₹${data.amount} spent at ${merchant.shopName} (${data.category}). Remaining balance: ₹${wallet.balance}.`,
        entityType: "Wallet",
        entityId: decoded.walletId,
        channels: ["IN_APP", "SMS"],
        priority: "NORMAL",
      });
    }
  } catch (error) {
    console.error("Failed to send payment-success notification:", error);
  }

  return BaseService.success({
    transactionId: wallet._id.toString() + "_" + Date.now(),
    remainingBalance: wallet.balance,
    amount: data.amount,
    category: data.category,
    merchantName: merchant.shopName,
  });
};

/*
GET MERCHANT TRANSACTIONS
reads from wallet embedded ledger for this merchant
*/
export const getMerchantTransactions = async (merchantUserId) => {
  const merchant = await Merchant.findOne({ user: merchantUserId });
  if (!merchant) throw new AppError("Merchant not found", 404);

  const wallets = await Wallet.find({
    "transactions.merchant": merchant._id,
  }).select("transactions beneficiary campaign");

  const transactions = [];
  for (const w of wallets) {
    for (const tx of w.transactions) {
      if (tx.merchant?.toString() === merchant._id.toString()) {
        transactions.push({
          id: tx._id,
          walletId: w._id,
          amount: tx.amount,
          category: tx.category,
          timestamp: tx.timestamp,
          balanceAfter: tx.balanceAfter,
        });
      }
    }
  }

  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return BaseService.success(transactions);
};
