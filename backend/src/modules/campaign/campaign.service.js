import { User } from "../../models/auth/User.model.js";

import { Campaign } from "../../models/ngo/Campaign.model.js";

import { AppError } from "../../utils/AppError.js";

import { BaseService } from "../../core/base.service.js";

import { withTransaction } from "../../core/transaction.js";

import { CAMPAIGN_STATUS } from "./campaign.constants.js";

import { generateHash } from "../../utils/hash.util.js";

import { createAuditLog } from "../audit/audit.service.js";

import { Notification } from "../../models/system/Notification.model.js";

import { addAIDecisionJob } from "../../jobs/ai.job.js";

export const createCampaign = async (ngoId, data) => {
  const ngo = await User.findById(ngoId);

  if (!ngo || ngo.verificationStatus !== "APPROVED") {
    throw new AppError("NGO not verified by admin yet", 403);
  }

  // Validate endDate is not in the past
  if (data.endDate && new Date(data.endDate) < new Date()) {
    throw new AppError("End date cannot be in the past", 400);
  }

  // Check for duplicate campaigns (same title by same NGO within 30 days)
  const recentCampaign = await Campaign.findOne({
    createdBy: ngoId,
    title: data.title,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });

  if (recentCampaign) {
    throw new AppError(
      "You have already created a campaign with this title recently. Please use a different title.",
      400,
    );
  }

  return withTransaction(async (session) => {
    const jobIdHash = generateHash({
      type: "CAMPAIGN",
      ngoId,
      timestamp: Date.now(),
      title: data.title,
    });

    const campaign = await Campaign.create(
      [
        {
          title: data.title,
          description: data.description,
          disasterType: data.disasterType,
          targetAmount: data.targetAmount,
          location: data.location,
          createdBy: ngoId,
          jobIdHash,

          policySnapshot: {
            allowedCategories: data.policy.allowedCategories,
            maxPerBeneficiary: data.policy.maxPerBeneficiary,
            validityDays: data.policy.validityDays,
            maxPerTransaction: data.policy.maxPerTransaction,
          },

          status: CAMPAIGN_STATUS.DRAFT,
        },
      ],
      { session },
    );

    return BaseService.created(campaign[0]);
  });
};

export const getCampaignById = async (id) => {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  return BaseService.success(campaign);
};

export const getAllActiveCampaigns = async () => {
  const campaigns = await Campaign.find({
    status: CAMPAIGN_STATUS.ACTIVE,
  });

  return BaseService.success(campaigns);
};

export const validateCampaignEditable = (campaign) => {
  if (
    campaign.status !== CAMPAIGN_STATUS.DRAFT &&
    campaign.status !== CAMPAIGN_STATUS.REJECTED
  ) {
    throw new AppError("Cannot edit campaign after submission", 400);
  }
};

export const updateCampaign = async (campaignId, ngoId, updateData) => {
  return withTransaction(async (session) => {
    // Validate campaign exists
    const campaign = await Campaign.findById(campaignId).session(session);

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    // Validate campaign is owned by NGO
    if (campaign.createdBy.toString() !== ngoId.toString()) {
      throw new AppError(
        "Unauthorized: You can only update your own campaigns",
        403,
      );
    }

    // Validate campaign is editable
    validateCampaignEditable(campaign);

    // Update campaign fields
    if (updateData.title) campaign.title = updateData.title;
    if (updateData.description) campaign.description = updateData.description;
    if (updateData.disasterType)
      campaign.disasterType = updateData.disasterType;
    if (updateData.targetAmount)
      campaign.targetAmount = updateData.targetAmount;
    if (updateData.location) campaign.location = updateData.location;
    if (updateData.policy) {
      campaign.policySnapshot = {
        allowedCategories: updateData.policy.allowedCategories,
        maxPerBeneficiary: updateData.policy.maxPerBeneficiary,
        validityDays: updateData.policy.validityDays,
        maxPerTransaction: updateData.policy.maxPerTransaction,
      };
    }

    await campaign.save({ session });

    // Create audit log entry
    await createAuditLog(
      {
        eventType: "CAMPAIGN_UPDATED",
        eventCategory: "CAMPAIGN",
        entityId: campaign._id.toString(),
        entityType: "Campaign",
        campaignId: campaign._id,
        jobIdHash: campaign.jobIdHash,
        actorId: ngoId,
        actorRole: "NGO",
        payload: {
          campaignId: campaign._id.toString(),
          updatedFields: Object.keys(updateData),
        },
        metadata: {
          updatedAt: new Date(),
        },
      },
      session,
    );

    return BaseService.success(campaign, "Campaign updated successfully");
  });
};

export const submitCampaignForApproval = async (campaignId, ngoId) => {
  return withTransaction(async (session) => {
    // Validate campaign exists
    const campaign = await Campaign.findById(campaignId).session(session);

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    // Validate campaign is owned by NGO
    if (campaign.createdBy.toString() !== ngoId.toString()) {
      throw new AppError(
        "Unauthorized: You can only submit your own campaigns",
        403,
      );
    }

    // Validate campaign status is DRAFT or REJECTED
    if (
      campaign.status !== CAMPAIGN_STATUS.DRAFT &&
      campaign.status !== CAMPAIGN_STATUS.REJECTED
    ) {
      throw new AppError(
        `Cannot submit campaign with status ${campaign.status}. Only DRAFT or REJECTED campaigns can be submitted.`,
        400,
      );
    }

    // Change campaign status to PENDING_APPROVAL
    campaign.status = CAMPAIGN_STATUS.PENDING_APPROVAL;
    campaign.submittedAt = new Date();
    await campaign.save({ session });

    // Create audit log entry
    await createAuditLog(
      {
        eventType: "CAMPAIGN_SUBMITTED",
        eventCategory: "CAMPAIGN",
        entityId: campaign._id.toString(),
        entityType: "Campaign",
        campaignId: campaign._id,
        jobIdHash: campaign.jobIdHash,
        actorId: ngoId,
        actorRole: "NGO",
        payload: {
          campaignId: campaign._id.toString(),
          title: campaign.title,
          targetAmount: campaign.targetAmount,
          status: campaign.status,
        },
        metadata: {
          submittedAt: campaign.submittedAt,
        },
      },
      session,
    );

    // Push campaign data to AI risk evaluation queue
    const ngo = await User.findById(campaign.createdBy).session(session);
    await addAIDecisionJob({
      type: "campaign-risk",
      payload: {
        campaignId: campaign._id.toString(),
        title: campaign.title,
        description: campaign.description,
        targetAmount: campaign.targetAmount,
        location: campaign.location,
        disasterType: campaign.disasterType,
        ngoId: campaign.createdBy.toString(),
        ngoName: ngo?.name || "Unknown",
        ngoVerificationStatus: ngo?.verificationStatus || "PENDING",
        ngoPastCampaigns: 0, // TODO: Calculate from database
        ngoSuccessRate: 0, // TODO: Calculate from database
      },
    });

    // Send notification to admins
    const admins = await User.find({ role: "ADMIN" }).session(session);

    for (const admin of admins) {
      await Notification.create(
        [
          {
            recipient: admin._id,
            role: "ADMIN",
            type: "CAMPAIGN_CREATED",
            title: "New Campaign Submitted for Approval",
            message: `Campaign "${campaign.title}" has been submitted by an NGO and requires your review.`,
            entityType: "Campaign",
            entityId: campaign._id.toString(),
            channels: ["IN_APP", "EMAIL"],
            priority: "HIGH",
            deliveryStatus: "PENDING",
          },
        ],
        { session },
      );
    }

    return BaseService.success(
      campaign,
      "Campaign submitted for approval successfully",
    );
  });
};

export const deleteCampaign = async (campaignId, ngoId) => {
  return withTransaction(async (session) => {
    // Validate campaign exists
    const campaign = await Campaign.findById(campaignId).session(session);

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    // Validate campaign is owned by NGO
    if (campaign.createdBy.toString() !== ngoId.toString()) {
      throw new AppError(
        "Unauthorized: You can only delete your own campaigns",
        403,
      );
    }

    // Validate campaign status is DRAFT
    if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
      throw new AppError(
        "Cannot delete campaign after submission. Only DRAFT campaigns can be deleted.",
        400,
      );
    }

    // Delete the campaign
    await Campaign.findByIdAndDelete(campaignId).session(session);

    // Create audit log entry
    await createAuditLog(
      {
        eventType: "CAMPAIGN_DELETED",
        eventCategory: "CAMPAIGN",
        entityId: campaign._id.toString(),
        entityType: "Campaign",
        campaignId: campaign._id,
        jobIdHash: campaign.jobIdHash,
        actorId: ngoId,
        actorRole: "NGO",
        payload: {
          campaignId: campaign._id.toString(),
          title: campaign.title,
          deletedAt: new Date(),
        },
        metadata: {
          reason: "NGO deleted DRAFT campaign",
        },
      },
      session,
    );

    return BaseService.success(null, "Campaign deleted successfully");
  });
};

export const pauseCampaign = async (campaignId, adminId, reason) => {
  return withTransaction(async (session) => {
    const campaign = await Campaign.findById(campaignId).session(session);

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    if (campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
      throw new AppError("Only ACTIVE campaigns can be paused", 400);
    }

    campaign.status = CAMPAIGN_STATUS.PAUSED;
    campaign.pausedReason = reason;
    await campaign.save({ session });

    // Create audit log
    await createAuditLog(
      {
        eventType: "CAMPAIGN_PAUSED",
        eventCategory: "CAMPAIGN",
        entityId: campaign._id.toString(),
        entityType: "Campaign",
        campaignId: campaign._id,
        jobIdHash: campaign.jobIdHash,
        actorId: adminId,
        actorRole: "ADMIN",
        payload: {
          campaignId: campaign._id.toString(),
          title: campaign.title,
          reason,
        },
      },
      session,
    );

    // Notify NGO
    await Notification.create(
      [
        {
          recipient: campaign.createdBy,
          role: "NGO",
          type: "CAMPAIGN_PAUSED",
          title: "Campaign Paused",
          message: `Your campaign "${campaign.title}" has been paused by an administrator. Reason: ${reason}`,
          entityType: "Campaign",
          entityId: campaign._id.toString(),
          channels: ["IN_APP", "EMAIL"],
          priority: "HIGH",
          deliveryStatus: "PENDING",
        },
      ],
      { session },
    );

    return BaseService.success(campaign, "Campaign paused successfully");
  });
};

export const resumeCampaign = async (campaignId, adminId) => {
  return withTransaction(async (session) => {
    const campaign = await Campaign.findById(campaignId).session(session);

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    if (campaign.status !== CAMPAIGN_STATUS.PAUSED) {
      throw new AppError("Only PAUSED campaigns can be resumed", 400);
    }

    campaign.status = CAMPAIGN_STATUS.ACTIVE;
    campaign.pausedReason = null;
    await campaign.save({ session });

    // Create audit log
    await createAuditLog(
      {
        eventType: "CAMPAIGN_RESUMED",
        eventCategory: "CAMPAIGN",
        entityId: campaign._id.toString(),
        entityType: "Campaign",
        campaignId: campaign._id,
        jobIdHash: campaign.jobIdHash,
        actorId: adminId,
        actorRole: "ADMIN",
        payload: {
          campaignId: campaign._id.toString(),
          title: campaign.title,
        },
      },
      session,
    );

    // Notify NGO
    await Notification.create(
      [
        {
          recipient: campaign.createdBy,
          role: "NGO",
          type: "CAMPAIGN_RESUMED",
          title: "Campaign Resumed",
          message: `Your campaign "${campaign.title}" has been resumed and is now active again.`,
          entityType: "Campaign",
          entityId: campaign._id.toString(),
          channels: ["IN_APP", "EMAIL"],
          priority: "MEDIUM",
          deliveryStatus: "PENDING",
        },
      ],
      { session },
    );

    return BaseService.success(campaign, "Campaign resumed successfully");
  });
};

export const completeCampaign = async (campaignId, reason) => {
  return withTransaction(async (session) => {
    const campaign = await Campaign.findById(campaignId).session(session);

    if (!campaign) {
      throw new AppError("Campaign not found", 404);
    }

    if (campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
      throw new AppError("Only ACTIVE campaigns can be completed", 400);
    }

    campaign.status = CAMPAIGN_STATUS.COMPLETED;
    await campaign.save({ session });

    // Create audit log
    await createAuditLog(
      {
        eventType: "CAMPAIGN_COMPLETED",
        eventCategory: "CAMPAIGN",
        entityId: campaign._id.toString(),
        entityType: "Campaign",
        campaignId: campaign._id,
        jobIdHash: campaign.jobIdHash,
        actorId: null,
        actorRole: "SYSTEM",
        payload: {
          campaignId: campaign._id.toString(),
          title: campaign.title,
          reason,
          totalDonated: campaign.totalDonated,
          totalBeneficiaries: campaign.totalBeneficiaries,
        },
      },
      session,
    );

    // Notify NGO
    await Notification.create(
      [
        {
          recipient: campaign.createdBy,
          role: "NGO",
          type: "CAMPAIGN_COMPLETED",
          title: "Campaign Completed",
          message: `Your campaign "${campaign.title}" has been completed. ${reason}`,
          entityType: "Campaign",
          entityId: campaign._id.toString(),
          channels: ["IN_APP", "EMAIL"],
          priority: "MEDIUM",
          deliveryStatus: "PENDING",
        },
      ],
      { session },
    );

    return BaseService.success(campaign, "Campaign completed successfully");
  });
};

export const checkAndCompleteCampaigns = async () => {
  const activeCampaigns = await Campaign.find({
    status: CAMPAIGN_STATUS.ACTIVE,
  });

  const completedCampaigns = [];

  for (const campaign of activeCampaigns) {
    let shouldComplete = false;
    let reason = "";

    // Check if target amount reached
    if (campaign.totalDonated >= campaign.targetAmount) {
      shouldComplete = true;
      reason = `Target amount of ₹${campaign.targetAmount} reached.`;
    }

    // Check if end date reached
    if (campaign.endDate && new Date() >= new Date(campaign.endDate)) {
      shouldComplete = true;
      reason = reason
        ? `${reason} End date reached.`
        : "Campaign end date reached.";
    }

    if (shouldComplete) {
      try {
        await completeCampaign(campaign._id, reason);
        completedCampaigns.push(campaign._id);
      } catch (error) {
        console.error(
          `Failed to complete campaign ${campaign._id}:`,
          error.message,
        );
      }
    }
  }

  return {
    success: true,
    completedCount: completedCampaigns.length,
    completedCampaigns,
  };
};
