import express from "express";
import { asyncHandler } from "../../core/asyncHandler.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { ApiResponse } from "../../core/apiResponse.js";
import * as publicController from "./public.controller.js";
import * as publicAuditController from "../donation/donation.public.controller.js";

const router = express.Router();

// Homepage statistics
router.get("/stats", publicController.getStats);

// Public campaigns list
router.get("/campaigns", publicController.getCampaigns);

// Get campaign by ID
router.get("/campaigns/:id", publicController.getCampaignById);

// Recent transactions for transparency
router.get("/recent-transactions", publicController.getRecentTransactions);

// Blockchain status
router.get("/blockchain-status", publicController.getBlockchainStatus);

// Public audit verify — anyone can verify by donationId or jobIdHash
router.get(
  "/audit/verify/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    let donation = null;
    let jobIdHash = id;

    try {
      donation = await Donation.findById(id)
        .populate("campaign", "title disasterType")
        .populate("donor", "name");
      if (donation) jobIdHash = donation.jobIdHash;
    } catch {
      // not a valid ObjectId — treat as jobIdHash directly
    }

    const logs = await AuditLog.find({ jobIdHash }).sort({ sequence: 1 });

    if (!logs.length) {
      return res
        .status(404)
        .json({ success: false, message: "No audit trail found" });
    }

    const lastLog = logs[logs.length - 1];

    res.json(
      ApiResponse.success({
        jobIdHash,
        donation: donation
          ? {
              id: donation._id,
              amount: donation.amount,
              status: donation.status,
              campaign: donation.campaign,
            }
          : null,
        auditTrail: logs,
        merkleRoot: lastLog.merkleRoot || null,
        blockchainAnchor: lastLog.blockchainAnchor || null,
        totalEvents: logs.length,
      }),
    );
  }),
);

// New public audit verification endpoints
router.get(
  "/audit/timeline/:donationId",
  publicAuditController.getPublicAuditTrail,
);
router.get(
  "/audit/blockchain/:donationId",
  publicAuditController.verifyBlockchainAnchor,
);
router.get(
  "/audit/verify-chain/:donationId",
  publicAuditController.verifyHashChain,
);
router.get("/audit/merkle/:donationId", publicAuditController.getMerkleRoot);

export default router;
