import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import accessRoutes from "../modules/auth/access.routes.js";
import campaignRoutes from "../modules/campaign/campaign.routes.js";
import donationRoutes from "../modules/donation/donation.routes.js";
import beneficiaryRoutes from "../modules/beneficiary/beneficiary.routes.js";
import walletRoutes from "../modules/wallet/wallet.routes.js";
import merchantRoutes from "../modules/merchant/merchant.routes.js";
import paymentRoutes from "../modules/merchant/payment.routes.js";
import ngoRoutes from "../modules/ngo/ngo.routes.js";
import adminRoutes from "../modules/governance/admin.routes.js";
import governmentRoutes from "../modules/governance/government.routes.js";
import auditRoutes from "../modules/audit/audit.routes.js";
import systemRoutes from "../modules/system/system.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";
import proofRoutes from "../modules/proof/proof.routes.js";
import settlementRoutes from "../modules/settlement/settlement.routes.js";
import publicRoutes from "../modules/public/public.routes.js";
import trustRoutes from "../modules/trust/trust.routes.js";

const router = express.Router();

// System health
router.use("/system", systemRoutes);

// Auth
router.use("/auth", authRoutes);

// Access requests (NGO / MERCHANT / GOVERNMENT apply here)
router.use("/access", accessRoutes);

// Public (no auth)
router.use("/public", publicRoutes);

// Campaigns
router.use("/campaigns", campaignRoutes);

// Donations + donor dashboard
router.use("/donations", donationRoutes);
// Alias: /donor/donations and /donor/dashboard point to donation routes
router.use("/donor", donationRoutes);

// Beneficiaries
router.use("/beneficiaries", beneficiaryRoutes);

// Wallet
router.use("/wallet", walletRoutes);

// Payments (QR scan/confirm)
router.use("/payments", paymentRoutes);

// Merchants
router.use("/merchants", merchantRoutes);
// Alias: /merchant/* → /merchants/*
router.use("/merchant", merchantRoutes);

// NGO operations
router.use("/ngo", ngoRoutes);

// Admin governance
router.use("/admin", adminRoutes);

// Government oversight
router.use("/government", governmentRoutes);

// Audit transparency
router.use("/audit", auditRoutes);

// Notifications
router.use("/notifications", notificationRoutes);

// Proofs
router.use("/proof", proofRoutes);

// Settlements
router.use("/settlements", settlementRoutes);

// Trust scores
router.use("/trust", trustRoutes);

export default router;
