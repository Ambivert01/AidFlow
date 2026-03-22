import express from "express";

// module routes

import authRoutes from "../modules/auth/auth.routes.js";

import campaignRoutes from "../modules/campaign/campaign.routes.js";

import donationRoutes from "../modules/donation/donation.routes.js";

import beneficiaryRoutes from "../modules/beneficiary/beneficiary.routes.js";

import walletRoutes from "../modules/wallet/wallet.routes.js";

import merchantRoutes from "../modules/merchant/merchant.routes.js";

import ngoRoutes from "../modules/ngo/ngo.routes.js";

import adminRoutes from "../modules/governance/admin.routes.js";

import governmentRoutes from "../modules/governance/government.routes.js";

import auditRoutes from "../modules/audit/audit.routes.js";

import systemRoutes from "../modules/system/system.routes.js";

const router = express.Router();

router.use("/system", systemRoutes);

// auth

router.use("/auth", authRoutes);

// campaign

router.use("/campaigns", campaignRoutes);

// donation

router.use("/donations", donationRoutes);

// beneficiary

router.use("/beneficiaries", beneficiaryRoutes);

// wallet

router.use("/wallets", walletRoutes);

// merchant

router.use("/merchants", merchantRoutes);

// NGO operations

router.use("/ngo", ngoRoutes);

// admin controls

router.use("/admin", adminRoutes);

// government controls

router.use("/government", governmentRoutes);

// transparency audit

router.use("/audit", auditRoutes);

export default router;
