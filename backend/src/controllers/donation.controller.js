import { Donation } from "../models/Donation.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { User } from "../models/User.model.js";
import { createWorkflowEngine } from "../services/workflow.service.js";
import { AuditLog } from "../models/AuditLog.model.js";

/**
 * Donor makes a donation
 * - Intake donation
 * - Trigger AidFlow workflow asynchronously
 */
export const donate = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    // 1 Validate campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Invalid campaign" });
    }

    // 2 Create donation (CREATED)
    const donation = await Donation.create({
      donor: req.user.id,
      campaign: campaignId,
      amount,
      status: "CREATED",
      lastDecisionBy: "SYSTEM",
    });

    // 3 Pick beneficiary (TEMP LOGIC)
    const beneficiary = await User.findOne({ role: "BENEFICIARY" });

    // 4 Trigger workflow (ASYNC, SAFE)
    if (beneficiary) {
      const workflow = createWorkflowEngine();

      workflow
        .processDonation({
          donation,
          campaign,
          beneficiary,
        })
        .then(async () => {
          donation.status = "READY_FOR_USE";
          donation.lastDecisionBy = "SYSTEM";
          await donation.save();
        })
        .catch(async (err) => {
          donation.status = "PENDING_NGO_REVIEW";
          donation.lastDecisionBy = "AI";
          donation.decisionReason = err.message;
          await donation.save();
        });
    }

    // 5 Immediate response to donor
    res.status(201).json({
      message: "Donation received",
      donationId: donation._id,
      // status: donation.status,
      auditHint: "Audit proof will be available shortly",
    });
  } catch (err) {
    console.error("DONATION ERROR →", err);
    res.status(500).json({
      message: "Donation failed",
      error: err.message,
    });
  }
};
