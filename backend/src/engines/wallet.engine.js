// src/engines/wallet.engine.js

import policyEngine from "./policy.engine.js";
import workflowEngine from "./workflow.engine.js";
import { createAuditLog } from "../modules/audit/audit.service.js";

class WalletEngine {
  async createWallet(data, session) {
    const wallet = await data.models.Wallet.create(
      {
        beneficiary: data.beneficiaryId,
        campaign: data.campaignId,
        balance: data.amount,

        policySnapshot: data.policy,

        expiresAt: data.expiresAt,

        status: "ACTIVE",
      },
      { session },
    );

    await createAuditLog(
      {
        entityType: "wallet",

        entityId: wallet.id,

        action: "WALLET_CREATED",
      },
      session,
    );

    return wallet;
  }

  async processTransaction(context, session) {
    const { wallet, merchantId, amount, category, lat, lng } = context;

    if (wallet.status !== "ACTIVE") {
      throw new Error("WALLET_NOT_ACTIVE");
    }

    if (wallet.balance < amount) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    policyEngine.validateTransaction(
      wallet.policySnapshot,

      {
        category,

        merchantId,

        amount,

        todaySpent: await this.calculateTodaySpent(wallet.id),

        walletExpiry: wallet.expiresAt,

        lat,

        lng,
      },
    );

    wallet.balance -= amount;

    await wallet.save({ session });

    const transaction = await this.createLedgerEntry(
      {
        walletId: wallet.id,

        merchantId,

        amount,

        category,
      },
      session,
    );

    await createAuditLog(
      {
        entityType: "transaction",

        entityId: transaction.id,

        action: "WALLET_DEBIT",
      },
      session,
    );

    await workflowEngine.handleTransactionCompleted(transaction);

    return transaction;
  }

  async createLedgerEntry(data, session) {
    const tx = await data.models.Transaction.create(
      {
        wallet: data.walletId,

        merchant: data.merchantId,

        amount: data.amount,

        category: data.category,

        status: "SUCCESS",
      },
      { session },
    );

    return tx;
  }

  async calculateTodaySpent(walletId) {
    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const total = await data.models.Transaction.aggregate([
      {
        $match: {
          wallet: walletId,

          createdAt: { $gte: todayStart },
        },
      },

      {
        $group: {
          _id: null,

          sum: { $sum: "$amount" },
        },
      },
    ]);

    return total[0]?.sum || 0;
  }
}

export default new WalletEngine();
