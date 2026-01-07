import { WalletEngine } from "../services/wallet.engine.js";
import { AuditService } from "../services/audit.service.js";
import { Wallet } from "../models/Wallet.model.js";

const auditService = new AuditService();
const walletEngine = new WalletEngine({ auditService });

/**
 * Spend from beneficiary wallet
 * Category is DERIVED from merchant profile (NOT request body)
 */
export const spendFromWallet = async (req, res) => {
  try {
    const { walletId, amount } = req.body;

    // Merchant safety checks
    if (!req.user.merchantProfile) {
      return res.status(403).json({
        message: "Merchant profile not found",
      });
    }

    if (req.user.merchantProfile.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Merchant is not authorized to accept payments",
      });
    }

    const merchantCategory = req.user.merchantProfile.category;

    if (!merchantCategory) {
      return res.status(400).json({
        message: "Merchant category not configured",
      });
    }

    // Spend from wallet (single source of truth)
    const wallet = await walletEngine.spend({
      walletId,
      amount,
      category: merchantCategory,
      merchantId: req.user.id,
    });

    res.json({
      message: "Payment successful",
      walletId: wallet._id,
      remainingBalance: wallet.balance,
      walletStatus: wallet.status,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || "Payment failed",
    });
  }
};

/*
 * Get merchant transaction history (READ-ONLY)
 */
export const getMerchantTransactions = async (req, res) => {
  try {
    const txns = await Wallet.find(
      {
        "transactions.reference": req.user.id,
      },
      {
        transactions: 1,
        beneficiary: 1,
        campaign: 1,
      }
    )
      .populate("beneficiary", "name")
      .populate("campaign", "title");

    // Flatten transactions for UI
    const result = txns.flatMap((w) =>
      w.transactions
        .filter((t) => t.reference === req.user.id)
        .map((t) => ({
          walletId: w._id,
          beneficiary: w.beneficiary,
          campaign: w.campaign,
          amount: t.amount,
          category: t.category,
          timestamp: t.timestamp,
        }))
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch merchant transactions",
    });
  }
};
