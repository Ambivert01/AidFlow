import { Donation } from "../../models/Donation.model.js";
import { Campaign } from "../../models/Campaign.model.js";
import { AppError } from "../../utils/AppError.js";
import { withTransaction } from "../../core/transaction.js";

import { createWallet } from "../wallet/wallet.service.js";

import { addDonationJob } from "../../jobs/donation.job.js";



/*
CREATE DONATION
FAST API
Only DB-safe operations in transaction
Heavy work → queue
*/
export const createDonation = async (userId, data) => {

  return withTransaction(async (session) => {

    // 1 Validate campaign
    const campaign = await Campaign.findById(data.campaignId).session(session);

    if (!campaign || campaign.status !== "ACTIVE") {
      throw new AppError("Invalid campaign", 400, "INVALID_CAMPAIGN");
    }

    // 2 Create donation
    const donation = await Donation.create(
      [
        {
          donor: userId,
          campaign: campaign._id,
          amount: data.amount,

          status: "PAYMENT_SUCCESS",
          paymentStatus: "SUCCESS",
        },
      ],
      { session }
    );

    // 3 Update campaign stats atomically
    await Campaign.updateOne(

      { _id: campaign._id },

      {
        $inc: {
          totalDonated: data.amount,
        },
      },

      { session }

    );

    // return donation created inside transaction
    return donation[0];

  })
  .then(async (donation) => {

    // 4 queue heavy processing AFTER transaction commit
    await addDonationJob({

      donationId: donation._id,

    });

    return donation;

  });

};



/*
NGO APPROVAL
*/
export const approveDonationByNGO = async (donationId, ngoId) => {

  const donation = await Donation.findById(donationId);

  if (!donation) {
    throw new AppError("Donation not found", 404);
  }

  donation.status = "NGO_APPROVED";

  donation.lastDecisionBy = "NGO";

  await donation.save();

  return donation;

};



/*
GOVERNMENT APPROVAL
*/
export const approveDonationByGovernment = async (donationId, govId) => {

  const donation = await Donation.findById(donationId);

  if (!donation) {
    throw new AppError("Donation not found", 404);
  }

  donation.status = "APPROVED_BY_GOVT";

  donation.lastDecisionBy = "GOVERNMENT";

  await donation.save();

  return donation;

};



/*
FINALIZE DONATION
CREATE WALLET SAFELY
*/
export const finalizeDonation = async (donationId, beneficiaryId) => {

  return withTransaction(async (session) => {

    const donation = await Donation.findById(donationId).session(session);

    if (!donation) {
      throw new AppError("Donation not found", 404);
    }

    // create wallet safely
    const wallet = await createWallet({

      beneficiary: beneficiaryId,

      campaign: donation.campaign,

      amount: donation.amount,

      session,

    });

    donation.wallet = wallet._id;

    donation.status = "READY_FOR_USE";

    await donation.save({ session });

    return wallet;

  });

};