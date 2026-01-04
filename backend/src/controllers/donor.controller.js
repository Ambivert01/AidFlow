import { Donation } from "../models/Donation.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { AuditLog } from "../models/AuditLog.model.js";

/*
 * Get donor donation history
 */
export const getMyDonations = async (req, res) => {
  try {
    const donorId = req.user.id;

    const donations = await Donation.find({ donor: donorId })
      .populate("campaign", "title disasterType location status")
      .sort({ createdAt: -1 });

    // Optional: audit trail (read-only)
    const donationIds = donations.map(d => d._id.toString());

    const audits = await AuditLog.find({
      entityId: { $in: donationIds },
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      donations,
      audits,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to load donor history",
    });
  }
};
