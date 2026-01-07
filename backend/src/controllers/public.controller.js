import { Campaign } from "../models/Campaign.model.js";
import { Donation } from "../models/Donation.model.js";

export const getPublicCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({ status: "ACTIVE" })
    .populate("createdBy", "name");

  const result = [];

  for (const c of campaigns) {
    const donations = await Donation.find({ campaign: c._id });

    const totalReceived = donations.reduce((s, d) => s + d.amount, 0);

    result.push({
      id: c._id,
      title: c.title,
      ngo: c.createdBy.name,
      disasterType: c.disasterType,
      location: c.location,
      policy: c.policySnapshot,
      totalReceived,
      status: c.status,
    });
  }

  res.json(result);
};
