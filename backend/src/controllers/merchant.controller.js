import jwt from "jsonwebtoken";
import { Wallet } from "../models/Wallet.model.js";
import { Merchant } from "../models/Merchant.model.js";
import { AuditService } from "../services/audit.service.js";
import { WalletEngine } from "../services/wallet.engine.js";

const auditService = new AuditService();
const walletEngine = new WalletEngine({ auditService });

/**
 * MERCHANT: Spend from beneficiary wallet
 * ONLY via QR token (no direct walletId spend allowed)
 */
export const spendFromWallet = async (req, res) => {
  try {
    const { qrToken, amount, category } = req.body;

    // 1 QR TOKEN REQUIRED
    if (!qrToken) {
      return res.status(400).json({
        message: "QR verification required",
      });
    }

    // 2 VERIFY QR TOKEN
    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.QR_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired QR" });
    }

    const { walletId, beneficiaryId } = decoded;

    // 3 FETCH MERCHANT PROFILE (identity + status)
    const merchant = await Merchant.findOne({ user: req.user.id });
    if (!merchant) {
      return res.status(403).json({ message: "Merchant not registered" });
    }

    // 4 Delegate policy + spending logic to WalletEngine (atomic, audited)
    const updatedWallet = await walletEngine.spend({
      walletId,
      amount,
      category,
      merchantId: req.user.id,
    });

    return res.json({
      message: "Payment successful",
      walletId: updatedWallet._id,
      remainingBalance: updatedWallet.balance,
      walletStatus: updatedWallet.status,
    });

  } catch (err) {
    console.error("MERCHANT SPEND ERROR:", err);
    return res.status(500).json({
      message: "Payment failed",
    });
  }
};

/**
 * MERCHANT: View transaction history
 */
export const getMerchantTransactions = async (req, res) => {
  try {
    const wallets = await Wallet.find(
      { "transactions.reference": req.user.id },
      { transactions: 1, beneficiary: 1, campaign: 1 }
    )
      .populate("beneficiary", "name")
      .populate("campaign", "title");

    const txns = wallets.flatMap((w) =>
      w.transactions
        .filter((t) => t.reference.toString() === req.user.id)
        .map((t) => ({
          walletId: w._id,
          beneficiary: w.beneficiary,
          campaign: w.campaign,
          amount: t.amount,
          category: t.category,
          balanceAfter: t.balanceAfter,
          timestamp: t.timestamp,
        }))
    );

    return res.json(txns);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};

/*
 * Get logged-in merchant profile
 */
export const getMyMerchantProfile = async (req, res) => {
  try {
    const merchant = await Merchant.findOne({ user: req.user.id });

    if (!merchant) {
      return res.status(404).json({
        message: "Merchant profile not found",
      });
    }

    res.json(merchant);
  } catch (err) {
    console.error("GET MERCHANT PROFILE ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch merchant profile",
    });
  }
};