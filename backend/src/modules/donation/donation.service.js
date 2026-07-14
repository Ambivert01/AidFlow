import { Donation } from "../../models/donor/Donation.model.js";
import { Campaign } from "../../models/ngo/Campaign.model.js";
import { AppError } from "../../utils/AppError.js";
import { withTransaction } from "../../core/transaction.js";
import { addDonationJob } from "../../jobs/donation.job.js";
import { generateHash } from "../../utils/hash.util.js";
import { DONATION_STATUS, WORKFLOW_STATE } from "./donation.constants.js";
import { createAuditLog } from "../audit/audit.service.js";

export const createDonation = async (userId, data, idempotencyKey = null) => {
  return withTransaction(async (session) => {
    // Validate campaign is active
    const campaign = await Campaign.findById(data.campaignId).session(session);

    if (!campaign || campaign.status !== "ACTIVE") {
      throw new AppError(
        "Invalid or inactive campaign",
        400,
        "INVALID_CAMPAIGN",
      );
    }

    // Generate unique job ID hash
    const jobIdHash = generateHash({
      type: "DONATION",
      userId: userId.toString(),
      campaignId: data.campaignId,
      amount: data.amount,
      timestamp: Date.now(),
    });

    // Create donation with INITIATED status (not PAYMENT_SUCCESS)
    const donation = await Donation.create(
      [
        {
          donor: userId,
          campaign: campaign._id,
          amount: data.amount,
          policySnapshot: campaign.policySnapshot,
          jobIdHash,
          idempotencyKey, // Store idempotency key
          status: DONATION_STATUS.INITIATED, // Start with INITIATED
          workflowState: WORKFLOW_STATE.PENDING, // Initial workflow state
          paymentStatus: "SUCCESS", // Assume payment successful for now
        },
      ],
      { session },
    );

    // Update campaign total donated
    await Campaign.updateOne(
      { _id: campaign._id },
      { $inc: { totalDonated: data.amount } },
      { session },
    );

    // Create initial audit log
    await createAuditLog(
      {
        eventType: "DONATION_CREATED",
        eventCategory: "DONATION",
        entityId: donation[0]._id.toString(),
        entityType: "Donation",
        campaignId: campaign._id,
        jobIdHash,
        actorId: userId,
        actorRole: "DONOR",
        payload: {
          donationId: donation[0]._id.toString(),
          campaignId: campaign._id.toString(),
          amount: data.amount,
          status: DONATION_STATUS.INITIATED,
        },
        metadata: {
          idempotencyKey,
        },
      },
      session,
    );

    return donation[0];
  }).then(async (donation) => {
    // Count this donor's donations in the last 24h (matching the fraud
    // check's timeWindowHours) so the fraud agent actually receives a real
    // frequency signal instead of always seeing 0 regardless of how many
    // donations this donor has actually made.
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const donorRecentDonationCount = await Donation.countDocuments({
      donor: userId,
      createdAt: { $gte: windowStart },
    });

    // Push to queue for async processing (don't call workflow engine here)
    await addDonationJob({
      donationId: donation._id.toString(),
      campaignId: donation.campaign.toString(),
      amount: donation.amount,
      donorId: userId.toString(),
      donorRecentDonationCount,
      deviceFingerprint: data.deviceFingerprint || undefined,
      location: data.location || undefined,
    });

    return donation;
  });
};

export const getDonationById = async (id) => {
  const donation = await Donation.findById(id);

  if (!donation) throw new AppError("Donation not found", 404);

  return donation;
};

export const getDonorDonations = async (userId) => {
  return Donation.find({
    donor: userId,
  }).sort({ createdAt: -1 });
};
