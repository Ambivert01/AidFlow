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

import notificationRoutes from "../modules/notification/notification.routes.js";

import proofRoutes from "../modules/proof/proof.routes.js";

import settlementRoutes from "../modules/settlement/settlement.routes.js";

const router = express.Router();

// system

router.use("/system", systemRoutes);

// auth

router.use("/auth", authRoutes);

// campaigns

router.use("/campaigns", campaignRoutes);

// donations

router.use("/donations", donationRoutes);

// beneficiaries

router.use("/beneficiaries", beneficiaryRoutes);

// wallet

router.use("/wallet", walletRoutes);

// merchants

router.use("/merchants", merchantRoutes);

// NGO

router.use("/ngo", ngoRoutes);

// admin

router.use("/admin", adminRoutes);

// government

router.use("/government", governmentRoutes);

// audit transparency

router.use("/audit", auditRoutes);

// notifications

router.use("/notifications", notificationRoutes);

// proofs

router.use("/proofs", proofRoutes);

// settlements

router.use("/settlements", settlementRoutes);

export default router;