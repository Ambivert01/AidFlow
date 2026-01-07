import crypto from "crypto";
import { Wallet } from "../models/Wallet.model.js";

const activeQrs = new Map(); // in-memory (ok for prototype)

export const generateQR = async (req, res) => {
  const { walletId, amount, category } = req.body;

  const payload = {
    id: crypto.randomUUID(),
    walletId,
    merchantId: req.user.id,
    amount,
    category,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
  };

  activeQrs.set(payload.id, payload);
  res.json({ qrPayload: JSON.stringify(payload) });
};

export const scanQR = async (req, res) => {
  const data = JSON.parse(req.body.qrData);

  if (!activeQrs.has(data.id)) {
    return res.status(400).json({ message: "QR expired or invalid" });
  }

  if (Date.now() > data.expiresAt) {
    activeQrs.delete(data.id);
    return res.status(400).json({ message: "QR expired" });
  }

  res.json(data);
};

export const confirmPayment = async (req, res) => {
  const { id } = req.body;
  const data = activeQrs.get(id);

  if (!data) {
    return res.status(400).json({ message: "Invalid payment" });
  }

  activeQrs.delete(id); // ONE-TIME USE
  res.json(data);
};
