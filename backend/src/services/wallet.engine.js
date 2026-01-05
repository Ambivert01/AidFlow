import { Wallet } from "../models/Wallet.model.js";

export class WalletEngine {
  constructor({ auditService }) {
    this.auditService = auditService;
  }

  /*
   * Create or fetch wallet (DB-backed)
   */
  async getOrCreateWallet({ beneficiaryId, campaignId, allowedCategories }) {
    let wallet = await Wallet.findOne({
      beneficiary: beneficiaryId,
      campaign: campaignId,
      status: "ACTIVE",
    });

    if (!wallet) {
      wallet = await Wallet.create({
        beneficiary: beneficiaryId,
        campaign: campaignId,
        balance: 0,
        allowedCategories,
        status: "ACTIVE",
      });
    }

    return wallet;
  }

  /*
   * Lock funds into wallet
   */
  async lock({ donationId, beneficiaryId, amount, policy, campaignId }) {
    const wallet = await this.getOrCreateWallet({
      beneficiaryId,
      campaignId,
      allowedCategories: policy.allowedCategories,
    });

    wallet.balance += amount;
    await wallet.save();

    await this.auditService.log({
      eventType: "WALLET_LOCKED",
      payload: {
        walletId: wallet._id,
        donationId,
        amount,
      },
      jobIdHash: donationId.toString(),
      campaignId,
    });

    return wallet;
  }

  /*
   * Spend from wallet (MERCHANT)
   */
  async spend({ walletId, amount, category, merchantId }) {
    const wallet = await Wallet.findById(walletId);

    if (!wallet) throw new Error("Wallet not found");
    if (wallet.status !== "ACTIVE")
      throw new Error("Wallet inactive");

    if (!wallet.allowedCategories.includes(category))
      throw new Error("Category not allowed");

    if (wallet.balance < amount)
      throw new Error("Insufficient balance");

    wallet.balance -= amount;

    if (wallet.balance === 0) {
      wallet.status = "CLOSED";
    }

    await wallet.save();

    await this.auditService.log({
      eventType: "WALLET_SPEND",
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

  /*
   * Close wallet (optional, end of lifecycle)
   */
  async closeWallet({ walletId }) {
    const wallet = await Wallet.findById(walletId);
    if (!wallet) throw new Error("Wallet not found");

    wallet.status = "CLOSED";
    await wallet.save();

    await this.auditService.log({
      eventType: "WALLET_CLOSED",
      payload: { walletId },
      jobIdHash: wallet.jobIdHash,
      campaignId: wallet.campaign,
    });
  }
}
