import crypto from "crypto";
import { Campaign } from "../models/Campaign.model.js";
import { AuditService } from "../services/audit.service.js";

const auditService = new AuditService();

/*
 * Create campaign (NGO only)
 * Status = DRAFT
 * Policy is SNAPSHOT and IMMUTABLE after activation
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

    // POLICY VALIDATION (CRITICAL)
    const REQUIRED_POLICY_FIELDS = [
      "allowedCategories",
      "maxPerBeneficiary",
      "validityDays",
      "cooldownDays",
      "minEligibilityConfidence",
      "maxFraudRisk",
    ];

    if (!policySnapshot) {
      return res.status(400).json({
        message: "Policy snapshot is required",
      });
    }

    for (const field of REQUIRED_POLICY_FIELDS) {
      if (policySnapshot[field] === undefined) {
        return res.status(400).json({
          message: `Missing policy field: ${field}`,
        });
      }
    }

    //  Generate workflow Job ID
    const jobIdHash = crypto
      .createHash("sha256")
      .update(`CAMPAIGN-${req.user.id}-${Date.now()}`)
      .digest("hex");

    //  Create Campaign (DRAFT)
    const campaign = await Campaign.create({
      title,
      description,
      disasterType,
      location,
      policySnapshot,
      createdBy: req.user.id,
      status: "DRAFT",
      jobIdHash,
    });

    // AUDIT — Campaign Created
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
    console.error("CAMPAIGN CREATE ERROR:", err);
    res.status(500).json({
      message: "Campaign creation failed",
    });
  }
};

/*
 * Activate campaign
 * Locks policy forever
 */
export const activateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    if (campaign.status !== "DRAFT") {
      return res.status(400).json({
        message: "Campaign cannot be activated",
      });
    }

    // Policy must exist to activate
    if (!campaign.policySnapshot) {
      return res.status(400).json({
        message: "Policy snapshot missing. Cannot activate campaign.",
      });
    }

    campaign.status = "ACTIVE";
    await campaign.save();

    // AUDIT — Campaign Activated
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

    res.json({
      message: "Campaign activated",
      campaign,
    });
  } catch (err) {
    console.error("CAMPAIGN ACTIVATE ERROR:", err);
    res.status(500).json({
      message: "Activation failed",
    });
  }
};

/*
 * Get active campaigns (PUBLIC)
 */
export const getActiveCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      status: "ACTIVE",
    }).sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch campaigns",
    });
  }
};

/*
 * Get campaigns created by logged-in NGO
 */
export const getNgoCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      createdBy: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (err) {
    console.error("GET NGO CAMPAIGNS ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch NGO campaigns",
    });
  }
};
