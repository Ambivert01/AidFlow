/*
 * Wallet Engine
 * Enforces programmable money rules
 */

export class WalletEngine {
  constructor({ auditService }) {
    this.auditService = auditService;
    this.wallets = new Map(); // in-memory for now (DB later)
  }

  /*
   * Lock funds with policy
   */
  async lock({ donationId, beneficiaryId, amount, policy }) {
    const walletId = `${donationId}_${beneficiaryId}`;

    this.wallets.set(walletId, {
      walletId,
      donationId,
      beneficiaryId,
      balance: amount,
      allowedCategories: policy.allowedCategories,
      expiresAt: Date.now() + policy.validityDays * 86400000,
      status: "ACTIVE",
    });

    await this.auditService.log("WALLET_LOCKED", {
      walletId,
      amount,
      allowedCategories: policy.allowedCategories,
    });

    return walletId;
  }

  /*
   * Spend from wallet (at merchant)
   */
  async spend({ walletId, amount, category, merchantId }) {
    const wallet = this.wallets.get(walletId);

    if (!wallet || wallet.status !== "ACTIVE") {
      throw new Error("Wallet inactive or missing");
    }

    if (Date.now() > wallet.expiresAt) {
      wallet.status = "EXPIRED";
      throw new Error("Wallet expired");
    }

    if (!wallet.allowedCategories.includes(category)) {
      throw new Error("Category not allowed");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    wallet.balance -= amount;

    await this.auditService.log("WALLET_SPEND", {
      walletId,
      amount,
      category,
      merchantId,
      remainingBalance: wallet.balance,
    });

    if (wallet.balance === 0) {
      wallet.status = "CLOSED";
    }

    return wallet.balance;
  }

  /*
   * Final release (logical completion)
   */
  async release({ donationId, beneficiaryId }) {
    const walletId = `${donationId}_${beneficiaryId}`;
    const wallet = this.wallets.get(walletId);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    wallet.status = "CLOSED";

    await this.auditService.log("WALLET_CLOSED", {
      walletId,
    });
  }
}
