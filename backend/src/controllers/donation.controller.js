import { Donation } from "../models/Donation.model.js";
import { Campaign } from "../models/Campaign.model.js";
import { User } from "../models/User.model.js";

import { createWorkflowEngine } from "../services/workflow.service.js";

/**
 * Donor makes a donation
 * - Intake donation
 * - Trigger AidFlow workflow asynchronously
*/
export const donate = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    // 1 Validate campaign
    console.log("campaignId received:", campaignId);

    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Invalid campaign" });
    }

    // 2 Create donation (INTAKE ONLY)
    const donation = await Donation.create({
      donor: req.user.id,
      campaign: campaignId,
      amount,
    });

    // 3 Pick beneficiary (TEMP LOGIC)
    // NOTE: Later this will be replaced by AI / queue / selection engine
    const beneficiary = await User.findOne({
      role: "BENEFICIARY",
    });

    // 4 Trigger workflow (NON-BLOCKING)
    if (beneficiary) {
      const workflow = createWorkflowEngine();

      workflow
        .processDonation({
          donation,
          campaign,
          beneficiary,
        })
        .catch((err) => {
          // VERY IMPORTANT:
          // Donation is valid even if workflow fails
          console.error("AidFlow workflow failed:", err.message);
        });
    }

    // 5 Immediate response to donor
    res.status(201).json({
      message: "Donation received",
      donationId: donation._id,
    });
  // } catch (err) {
  //   console.error("Donation error:", err);
  //   res.status(500).json({ message: "Donation failed" });
  // }
  } catch (err) {
  console.error("DONATION ERROR →", err);
  res.status(500).json({
    message: "Donation failed",
    error: err.message
  });
}

};
