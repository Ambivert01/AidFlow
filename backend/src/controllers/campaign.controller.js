import crypto from "crypto";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();


import { Campaign } from "../models/Campaign.model.js";

/*
 * Create campaign (NGO only)
 * Status = DRAFT
 */
export const createCampaign = async (req, res) => {
  try {
    const {
      title,
      description,
      disasterType,
      location,
      policySnapshot,
    } = req.body;

    const jobIdHash = crypto
      .createHash("sha256")
      .update(`CAMPAIGN-${req.user.id}-${Date.now()}`)
      .digest("hex");

    const campaign = await Campaign.create({
      title,
      description,
      disasterType,
      location,
      policySnapshot,
      createdBy: req.user.id,
      status: "DRAFT",
      jobIdHash, // added
    });

    // 🔹 AUDIT (NEW)
    await auditService.log({
      eventType: "CAMPAIGN_CREATED",
      payload: {
        campaignId: campaign._id,
        status: "DRAFT",
      },
      jobIdHash,
      campaignId: campaign._id,
      actorRole: "NGO",
    });


    res.status(201).json({
      message: "Campaign created (DRAFT)",
      campaign,
    });
  } catch (err) {
    res.status(500).json({ message: "Campaign creation failed" });
  }
};

/*
 * Activate campaign (locks policy)
 */
export const activateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status !== "DRAFT") {
      return res.status(400).json({ message: "Campaign cannot be activated" });
    }

    campaign.status = "ACTIVE";
    await campaign.save();

    // 🔹 AUDIT (NEW)
    await auditService.log({
      eventType: "CAMPAIGN_ACTIVATED",
      payload: {
        campaignId: campaign._id,
        status: "ACTIVE",
      },
      jobIdHash: campaign.jobIdHash,
      campaignId: campaign._id,
      actorRole: "NGO",
    });

    res.json({ message: "Campaign activated", campaign });

  } catch (err) {
    res.status(500).json({ message: "Activation failed" });
  }
};

/*
 * Get active campaigns (public)
 */
export const getActiveCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({ status: "ACTIVE" }).sort({
    createdAt: -1,
  });

  res.json(campaigns);
};
