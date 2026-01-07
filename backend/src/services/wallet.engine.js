import { Wallet } from "../models/Wallet.model.js";


export class WalletEngine {
  constructor({ auditService }) {
    this.auditService = auditService;
  }

  async spend({ walletId, amount, category, merchantId }) {
    const wallet = await Wallet.findById(walletId);

    if (!wallet) throw new Error("Wallet not found");
    if (wallet.status !== "ACTIVE") throw new Error("Wallet inactive");

    if (!wallet.policy.allowedCategories.includes(category)) {
      throw new Error("Category not allowed");
    }

    if (amount > wallet.policy.maxPerTransaction) {
      throw new Error("Amount exceeds policy limit");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    wallet.balance -= amount;

    if (wallet.balance === 0) {
      wallet.status = "CLOSED";
    }

    await wallet.save();

    await this.auditService.log({
      eventType: "WALLET_SPENT",
      payload: {
        walletId,
        amount,
        category,
        merchantId,
        remainingBalance: wallet.balance,
      },
      jobIdHash: wallet.jobIdHash,
      campaignId: wallet.campaign,
      actorRole: "MERCHANT",
    });

    return wallet;
  }
}
//   /*
//    * Close wallet (optional, end of lifecycle)
//    */
//   async closeWallet({ walletId }) {
//     const wallet = await Wallet.findById(walletId);
//     if (!wallet) throw new Error("Wallet not found");

//     wallet.status = "CLOSED";
//     await wallet.save();

//     await this.auditService.log({
//       eventType: "WALLET_CLOSED",
//       payload: { walletId },
//       jobIdHash: wallet.jobIdHash,
//       campaignId: wallet.campaign,
//     });
  
// }
