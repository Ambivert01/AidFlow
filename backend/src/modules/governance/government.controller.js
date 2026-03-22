import { asyncHandler } from "../../core/asyncHandler.js";

import * as govService from "./government.service.js";

export const reviewDonation = asyncHandler(async (req, res) => {
  const result = await govService.reviewHighRiskDonation(
    req.params.id,

    req.body.decision,

    req.user._id,
  );

  res.json(result);
});
