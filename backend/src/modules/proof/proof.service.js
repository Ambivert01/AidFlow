import { Proof } from "../../models/Proof.model.js";

import { Donation } from "../../models/Donation.model.js";

import { BaseService } from "../../core/base.service.js";

import { AppError } from "../../utils/AppError.js";

import { addAIDecisionJob } from "../../jobs/ai.job.js";

import { createAuditLog } from "../audit/audit.service.js";

export const uploadProof = async (ngoId, data) => {
  const donation = await Donation.findById(data.donationId);

  if (!donation) {
    throw new AppError("Donation not found", 404);
  }

  const proof = await Proof.create({
    campaign: donation.campaign,
    beneficiary: data.beneficiaryId,
    proofType: data.type,

    files: [
      {
        fileUrl: data.fileUrl,
        fileType: "IMAGE",
      },
    ],

    location: {
      lat: data.geoLocation?.lat,
      lng: data.geoLocation?.lng,
    },

    status: "UPLOADED",
  });

  // AI verification job

  await addAIDecisionJob({
    type: "proof-validation",
    payload: {
      proofId: proof._id,
      fileUrl: data.fileUrl,
      geoLocation: data.geoLocation,
    },
  });

  // audit log

  await createAuditLog({
    eventType: "PROOF_UPLOADED",

    entityId: proof._id,

    actorRole: "NGO",

    payload: {
      donationId: data.donationId,
    },
  });

  return BaseService.created(proof);
};

export const getDonationProofs = async (donationId) => {
  const proofs = await Proof.find({
    campaign: donation.campaign,

    beneficiary: data.beneficiaryId,
  });

  return BaseService.success(proofs);
};
