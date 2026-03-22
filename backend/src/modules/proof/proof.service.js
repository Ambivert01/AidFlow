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
    donationId: data.donationId,

    beneficiaryId: data.beneficiaryId,

    uploadedBy: ngoId,

    type: data.type,

    fileUrl: data.fileUrl,

    geoLocation: data.geoLocation,

    status: "UPLOADED",
  });

  // AI verification job

  await addAIDecisionJob({
    type: "PROOF_VERIFICATION",

    proofId: proof._id,
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
    donationId,
  });

  return BaseService.success(proofs);
};
