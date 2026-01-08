import { Donation } from "../models/Donation.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditService } from "../services/audit.service.js";

/*
 * DONOR → Create donation
 * NO workflow execution here
 */
export const donate = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    // 1 Validate campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Invalid or inactive campaign" });
    }

    // 2 Create donation
    const donation = await Donation.create({
      donor: req.user.id,
      campaign: campaignId,
      amount,
      status: "CREATED",
      lastDecisionBy: "SYSTEM",
    });

    const jobIdHash = donation._id.toString();

    // 3 Audit: DONATION_CREATED
    const auditService = new AuditService();
    await auditService.log({
      eventType: "DONATION_CREATED",
      payload: {
        donationId: donation._id,
        amount,
      },
      jobIdHash,
      campaignId: campaign._id,
      actorRole: "DONOR",
    });

    // 4 Move to NGO review (AI / Policy happens later)
    donation.status = "PENDING_NGO_REVIEW";
    await donation.save();

    // 5 Respond immediately
    return res.status(201).json({
      message: "Donation received and queued for review",
      donationId: donation._id,
      status: donation.status,
      auditId: jobIdHash,
    });

  } catch (err) {
    console.error("DONATION ERROR →", err);
    return res.status(500).json({
      message: "Donation failed",
    });
  }
};

/*
 * SYSTEM refund (future use)
 */
export const refundDonation = async (donation) => {
  donation.status = "REFUNDED";
  donation.lastDecisionBy = "SYSTEM";
  await donation.save();
};
