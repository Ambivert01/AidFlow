import policyEngine from "./policy.engine.js";
import workflowEngine from "./workflow.engine.js";
import { createAuditLog } from "../modules/audit/audit.service.js";
import { Wallet } from "../models/wallet/Wallet.model.js";

class WalletEngine {
  async createWallet(data, session) {
    const wallet = await Wallet.create(
      [
        {
          beneficiary: data.beneficiaryId,
          campaign: data.campaignId,
          balance: data.amount,
          policySnapshot: data.policy,
          expiresAt: data.expiresAt,
          status: "ACTIVE",
        },
      ],
      { session },
    );

    await createAuditLog(
      {
        entityType: "Wallet",
        entityId: wallet[0].id,
        eventType: "WALLET_CREATED",
        actorRole: "SYSTEM",
      },
      session,
    );

    return wallet[0];
  }

  async processTransaction(context, session) {
    const { wallet, merchantId, amount, category, lat, lng } = context;

    if (wallet.status !== "ACTIVE") throw new Error("WALLET_NOT_ACTIVE");
    if (wallet.balance < amount) throw new Error("INSUFFICIENT_BALANCE");

    policyEngine.validateTransaction(wallet.policySnapshot, {
      category,
      merchantId,
      amount,
      todaySpent: await this.calculateTodaySpent(wallet._id),
      walletExpiry: wallet.expiresAt,
      lat,
      lng,
    });

    wallet.balance -= amount;
    await wallet.save({ session });

    await createAuditLog(
      {
        entityType: "Wallet",
        entityId: wallet.id,
        eventType: "WALLET_DEBIT",
        actorRole: "SYSTEM",
        payload: { amount, merchantId, category },
      },
      session,
    );

    await workflowEngine.handleTransactionCompleted({ id: wallet.id, amount });

    return wallet;
  }

  async calculateTodaySpent(walletId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const total = await Wallet.aggregate([
      { $match: { _id: walletId } },
      { $unwind: "$transactions" },
      {
        $match: {
          "transactions.type": "DEBIT",
          "transactions.timestamp": { $gte: todayStart },
        },
      },
      { $group: { _id: null, sum: { $sum: "$transactions.amount" } } },
    ]);

    return total[0]?.sum || 0;
  }
}

export default new WalletEngine();
