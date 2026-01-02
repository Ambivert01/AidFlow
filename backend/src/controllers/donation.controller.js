import { Donation } from "../models/Donation.model.js";
import { Campaign } from "../models/Campaign.model.js";

/**
 * Donor makes a donation (INTAKE ONLY)
 */
export const donate = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Invalid campaign" });
    }

    const donation = await Donation.create({
      donor: req.user.id,
      campaign: campaignId,
      amount,
    });

    res.status(201).json({
      message: "Donation received",
      donationId: donation._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Donation failed" });
  }
};
