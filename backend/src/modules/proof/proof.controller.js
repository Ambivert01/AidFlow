import { asyncHandler } from "../../core/asyncHandler.js";

import * as proofService from "./proof.service.js";

export const uploadProof = asyncHandler(async (req, res) => {
  const result = await proofService.uploadProof(
    req.user._id,

    req.body,
  );

  res.status(201).json(result);
});

export const getProofs = asyncHandler(async (req, res) => {
  const result = await proofService.getDonationProofs(req.params.donationId);

  res.json(result);
});
