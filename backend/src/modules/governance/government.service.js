import { Donation } from "../../models/donor/Donation.model.js";

import { BaseService } from "../../core/base.service.js";

import { AppError } from "../../utils/AppError.js";

export const reviewHighRiskDonation = async (
  donationId,

  decision,

  govId,
) => {
  const donation = await Donation.findById(donationId);

  if (!donation) {
    throw new AppError("Donation not found", 404);
  }

  if (decision === "APPROVE") {
    donation.status = "APPROVED_BY_GOVT";
  }

  if (decision === "REJECT") {
    donation.status = "REJECTED_BY_GOVT";
  }

  donation.lastDecisionBy = "GOVERNMENT";

  await donation.save();

  return BaseService.updated(donation);
};
