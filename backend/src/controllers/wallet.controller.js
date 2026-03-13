import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Wallet } from "../models/Wallet.model.js";
import { Beneficiary } from "../models/Beneficiary.model.js";
import { Nonce } from "../models/Nonce.model.js";
import { AuditService } from "../services/audit.service.js";
import { WalletEngine } from "../services/wallet.engine.js";

const auditService = new AuditService();
const walletEngine = new WalletEngine({ auditService });

/* ──────────────────────────────────────────
   BENEFICIARY: Get my wallet
────────────────────────────────────────── */
export const getMyWallet = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({ user: req.user.id });
    if (!beneficiary)
      return res.json(null);

    const wallet = await Wallet.findOne({
      beneficiary: beneficiary._id,
      status: { $in: ["ACTIVE", "FROZEN"] },
    }).populate("campaign", "title disasterType");

    if (!wallet) return res.json(null);

    res.json(wallet);
  } catch (err) {
    console.error("GET WALLET ERROR:", err);
    res.status(500).json({ message: "Failed to fetch wallet" });
  }
};

/* ──────────────────────────────────────────
   BENEFICIARY: Get my wallet transactions
────────────────────────────────────────── */
export const getWalletTransactions = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({ user: req.user.id });
    if (!beneficiary)
      return res.status(404).json({ message: "No beneficiary record found" });

    const wallet = await Wallet.findOne({ beneficiary: beneficiary._id });
    if (!wallet) return res.json([]);

    res.json(wallet.transactions.sort((a, b) => b.timestamp - a.timestamp));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

/* ──────────────────────────────────────────
   BENEFICIARY: Generate QR token (JWT-signed, 10 min expiry)
────────────────────────────────────────── */
export const generateQRToken = async (req, res) => {
  try {
    const { walletId } = req.body;
    const beneficiary = await Beneficiary.findOne({ user: req.user.id });
    if (!beneficiary)
      return res.status(400).json({ message: "No beneficiary record found" });

    const query = { beneficiary: beneficiary._id, status: "ACTIVE" };
    if (walletId) query._id = walletId;

    const wallet = await Wallet.findOne(query);

    if (!wallet)
      return res.status(400).json({ message: "No active wallet found" });

    // JWT-signed QR payload (10 minute expiry)
    const jti = crypto.randomBytes(16).toString("hex");
    const qrToken = jwt.sign(
      {
        jti,
        walletId: wallet._id.toString(),
        beneficiaryId: beneficiary._id.toString(),
        allowedCategories: wallet.policy.allowedCategories,
        maxPerTransaction: wallet.policy.maxPerTransaction,
        balance: wallet.balance,
        type: "WALLET_QR",
      },
      process.env.QR_SECRET || process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.json({
      qrToken,
      expiresIn: "10 minutes",
      walletInfo: {
        balance: wallet.balance,
        allowedCategories: wallet.policy.allowedCategories,
        maxPerTransaction: wallet.policy.maxPerTransaction,
        expiresAt: wallet.policy.expiresAt,
      },
    });
  } catch (err) {
    console.error("QR GENERATE ERROR:", err);
    res.status(500).json({ message: "Failed to generate QR" });
  }
};

/* ──────────────────────────────────────────
   MERCHANT: Scan beneficiary QR
────────────────────────────────────────── */
export const scanQR = async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ message: "QR token required" });

    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.QR_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired QR token" });
    }

    if (decoded.type !== "WALLET_QR")
      return res.status(400).json({ message: "Invalid QR type" });

    // Return wallet info to merchant (no PII)
    res.json({
      walletId: decoded.walletId,
      beneficiaryId: decoded.beneficiaryId,
      allowedCategories: decoded.allowedCategories,
      maxPerTransaction: decoded.maxPerTransaction,
      balance: decoded.balance,
      valid: true,
    });
  } catch (err) {
    res.status(400).json({ message: "QR scan failed" });
  }
};

/* ──────────────────────────────────────────
   MERCHANT: Confirm payment using QR token
────────────────────────────────────────── */
export const confirmPayment = async (req, res) => {
  try {
    const { qrToken, amount, category } = req.body;
    const merchantId = req.user.id;

    if (!qrToken) return res.status(400).json({ message: "QR token required" });
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });
    if (!category) return res.status(400).json({ message: "Category required" });

    // Verify QR token
    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.QR_SECRET || process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired QR" });
    }

    // REPLAY PROTECTION: Verify JTI
    if (decoded.jti) {
      const alreadyUsed = await Nonce.findOne({ jti: decoded.jti });
      if (alreadyUsed) {
        return res.status(401).json({ message: "QR Token has already been used (Replay blocked)" });
      }
      // Mark as used
      await Nonce.create({ jti: decoded.jti });
    }

    const updatedWallet = await walletEngine.spend({
      walletId: decoded.walletId,
      amount,
      category,
      merchantId,
    });

    res.json({
      message: "Payment successful",
      remainingBalance: updatedWallet.balance,
      walletStatus: updatedWallet.status,
      amount,
      category,
    });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(400).json({ message: err.message || "Payment failed" });
  }
};
