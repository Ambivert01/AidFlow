import crypto from "crypto";
import { Wallet } from "../models/Wallet.model.js";
import { AuditService } from "../services/audit.service.js";
import { WalletEngine } from "../services/wallet.engine.js";

const activeQrs = new Map();
const auditService = new AuditService();
const walletEngine = new WalletEngine({ auditService });

/*
 * BENEFICIARY: Initiate payment by scanning QR
 */
export const initiatePayment = async (req, res) => {
  try {
    const data = JSON.parse(req.body.qrData);

    if (!activeQrs.has(data.id)) {
      return res.status(400).json({ message: "QR expired or invalid" });
    }

    if (Date.now() > data.expiresAt) {
      activeQrs.delete(data.id);
      return res.status(400).json({ message: "QR expired" });
    }

    res.json(data);
  } catch {
    res.status(400).json({ message: "Invalid QR payload" });
  }
};

/*
 * BENEFICIARY: Confirm payment (actual wallet spend)
 */
export const confirmPayment = async (req, res) => {
  try {
    const { walletId, merchantId, amount, category } = req.body;

    const wallet = await walletEngine.spend({
      walletId,
      amount,
      category,
      merchantId,
    });

    res.json({
      message: "Payment successful",
      remainingBalance: wallet.balance,
      status: wallet.status,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/*
 * BENEFICIARY: Payment history
 */
export const paymentHistory = async (req, res) => {
  try {
    const wallets = await Wallet.find(
      { beneficiary: req.user.id },
      { transactions: 1 }
    );

    const history = wallets.flatMap((w) =>
      w.transactions.map((t) => ({
        amount: t.amount,
        category: t.category,
        merchantId: t.reference,
        createdAt: t.timestamp,
      }))
    );

    res.json(history);
  } catch {
    res.status(500).json({ message: "Failed to fetch history" });
  }
};
