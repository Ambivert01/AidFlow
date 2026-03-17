import { Donation } from "../../models/Donation.model.js";
import { Campaign } from "../../models/Campaign.model.js";
import { AppError } from "../../utils/AppError.js";

import { runDonationAI } from "../../infrastructure/ai/ai.service.js";
import { createWallet } from "../wallet/wallet.service.js";
import { createAuditLog } from "../audit/audit.service.js";

export const createDonation = async (userId, data) => {
  // 1 Validate campaign
  const campaign = await Campaign.findById(data.campaignId);

  if (!campaign || campaign.status !== "ACTIVE") {
    throw new AppError("Invalid campaign", 400, "INVALID_CAMPAIGN");
  }

  // 2 Create donation record
  const donation = await Donation.create({
    donor: userId,
    campaign: campaign._id,
    amount: data.amount,
    status: "PAYMENT_PENDING",
  });

  // 3 Simulate payment success (replace with gateway later)
  donation.paymentStatus = "SUCCESS";
  donation.status = "PAYMENT_SUCCESS";
  await donation.save();

  // 4 Run AI Risk Analysis
  const aiResult = await runDonationAI(donation);

  donation.aiDecision = {
    decision: aiResult.decision,
    riskScore: aiResult.riskScore,
    fraudSignals: aiResult.flags,
  };

  // 5 Route Decision
  if (aiResult.riskScore > 80) {
    donation.status = "HIGH_RISK_ESCALATED";
  } else {
    donation.status = "PENDING_NGO_REVIEW";
  }

  await donation.save();

  // 6 Audit Log
  await createAuditLog({
    eventType: "DONATION_CREATED",
    entityId: donation._id,
    actorRole: "DONOR",
    payload: {
      amount: donation.amount,
    },
  });

  return donation;
};

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

export const approveDonationByGovernment = async (donationId, govId) => {
  const donation = await Donation.findById(donationId);

  donation.status = "APPROVED_BY_GOVT";
  donation.lastDecisionBy = "GOVERNMENT";

  await donation.save();

  return donation;
};

export const finalizeDonation = async (donationId, beneficiaryId) => {
  const donation = await Donation.findById(donationId);

  // Create wallet
  const wallet = await createWallet({
    beneficiary: beneficiaryId,
    campaign: donation.campaign,
    amount: donation.amount,
  });

  donation.wallet = wallet._id;
  donation.status = "READY_FOR_USE";

  await donation.save();

  return wallet;
};