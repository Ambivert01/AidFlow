import { Donation } from "../models/Donation.model.js";
import { AuditLog } from "../models/AuditLog.model.js";

export const getMyDonations = async (req, res) => {
  try {
    const donorId = req.user.id;

    const donations = await Donation.find({ donor: donorId })
      .populate("campaign", "title location")
      .sort({ createdAt: -1 });

    const result = [];

    for (const d of donations) {
      const audit = await AuditLog.findOne({
        jobIdHash: d._id.toString(),
        eventType: "WORKFLOW_COMPLETED",
      });

      result.push({
        donationId: d._id,
        campaign: d.campaign,
        amount: d.amount,
        status: d.status,
        auditHash: audit ? audit.hash : null,
        createdAt: d.createdAt,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load donor history" });
  }
};
