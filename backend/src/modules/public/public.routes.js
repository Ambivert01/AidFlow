import express from "express";
import { asyncHandler } from "../../core/asyncHandler.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { AuditLog } from "../../models/audit/AuditLog.model.js";
import { Donation } from "../../models/donor/Donation.model.js";
import { ApiResponse } from "../../core/apiResponse.js";

const router = express.Router();

// Public campaigns — no auth required
router.get(
  "/campaigns",
  asyncHandler(async (req, res) => {
    const filter = { status: "ACTIVE" };
    if (req.query.disasterType) filter.disasterType = req.query.disasterType;
    if (req.query.q) {
      filter.$or = [
        { title: { $regex: req.query.q, $options: "i" } },
        { "location.state": { $regex: req.query.q, $options: "i" } },
        { "location.district": { $regex: req.query.q, $options: "i" } },
      ];
    }
    const campaigns = await Campaign.find(filter)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json(ApiResponse.success(campaigns));
  })
);

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
      return res.status(404).json({ success: false, message: "No audit trail found" });
    }

    const lastLog = logs[logs.length - 1];

    res.json(ApiResponse.success({
      jobIdHash,
      donation: donation
        ? { id: donation._id, amount: donation.amount, status: donation.status, campaign: donation.campaign }
        : null,
      auditTrail: logs,
      merkleRoot: lastLog.merkleRoot || null,
      blockchainAnchor: lastLog.blockchainAnchor || null,
      totalEvents: logs.length,
    }));
  })
);

export default router;
