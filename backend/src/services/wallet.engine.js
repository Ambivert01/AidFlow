import { Wallet } from "../models/Wallet.model.js";
import { Merchant } from "../models/Merchant.model.js";

export class WalletEngine {
  constructor({ auditService }) {
    this.auditService = auditService;
  }

  /*
   * MERCHANT spends from beneficiary wallet
   */
  async spend({ walletId, amount, category, merchantId }) {
    /*
       1. Fetch Wallet
    */
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    /*
       2. Wallet State Checks
    */
    if (wallet.status === "FROZEN") throw new Error("Wallet frozen by authority");
    if (wallet.status !== "ACTIVE") throw new Error("Wallet is not active");

    /*
       3. Wallet Policy Enforcement
    */
    const normalizedCategory = category.toUpperCase();
    if (!wallet.policy.allowedCategories.includes(normalizedCategory)) {
      throw new Error("Category not allowed by wallet policy");
    }

    if (amount > wallet.policy.maxPerTransaction) {
      throw new Error("Amount exceeds per-transaction limit");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    if (wallet.policy?.expiresAt && new Date(wallet.policy.expiresAt).getTime() <= Date.now()) {
      wallet.status = "EXPIRED";
      await wallet.save();
      await this.auditService.log({
        eventType: "WALLET_EXPIRED",
        payload: { walletId: wallet._id },
        jobIdHash: wallet.jobIdHash,
        campaignId: wallet.campaign,
        actorRole: "SYSTEM",
      });
      throw new Error("Wallet expired");
    }

    /*
       4. Fetch Merchant (CRITICAL)
    */
    const merchant = await Merchant.findOne({ user: merchantId });

    if (!merchant) {
      throw new Error("Merchant not registered");
    }

    if (merchant.status !== "ACTIVE") {
      throw new Error("Merchant is suspended");
    }

    if (merchant.category !== normalizedCategory) {
      await this.auditService.log({
        eventType: "MERCHANT_CATEGORY_VIOLATION",
        payload: {
          merchantId,
          walletId,
          attemptedCategory: normalizedCategory,
          merchantCategory: merchant.category,
        },
        jobIdHash: wallet.jobIdHash,
        campaignId: wallet.campaign,
        actorRole: "SYSTEM",
      });

      throw new Error("Merchant category mismatch — violation recorded");
    }

    /*
       6. Atomic Deduct Balance (Protection Against Double-Spending / Race Conditions)
    */
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Invalid transaction amount");
    }

    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: walletId,
        status: "ACTIVE",
        balance: { $gte: numericAmount },
      },
      {
        $inc: { balance: -numericAmount, merchantTransactionCount: 1 },
        $push: {
          transactions: {
            type: "DEBIT",
            amount: numericAmount,
            category: normalizedCategory,
            merchantId: merchantId.toString(),
            merchantName: merchant.shopName || "Merchant",
            reference: merchantId,
            balanceAfter: wallet.balance - numericAmount,
            timestamp: new Date(),
          },
        },
        $set: { lastTransactionAt: new Date() },
      },
      { new: true }
    );

    if (!updatedWallet) {
      throw new Error("Transaction failed — possible insufficient balance or inactive wallet state");
    }

    // Update status if empty
    if (updatedWallet.balance === 0) {
      updatedWallet.status = "CLOSED";
      await updatedWallet.save();
    }

    // Merchant accounting (off-chain trust signals)
    await Merchant.updateOne(
      { user: merchantId },
      {
        $inc: {
          transactionCount: 1,
          totalSettled: numericAmount,
        },
      }
    );

    /*
       8. Immutable Audit Log
    */
    await this.auditService.log({
      eventType: "WALLET_SPENT",
      payload: {
        walletId,
        amount: numericAmount,
        category,
        merchantId,
        remainingBalance: updatedWallet.balance,
      },
      jobIdHash: updatedWallet.jobIdHash,
      campaignId: updatedWallet.campaign,
      actorRole: "MERCHANT",
    });

    return updatedWallet;
  }

  /**
   * SYSTEM / GOVERNMENT wallet close
   */
  async closeWallet({ walletId }) {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    wallet.status = "CLOSED";
    await wallet.save();

    await this.auditService.log({
      eventType: "WALLET_CLOSED",
      payload: { walletId },
      jobIdHash: wallet.jobIdHash,
      campaignId: wallet.campaign,
      actorRole: "SYSTEM",
    });

    return wallet;
  }
}
