import { asyncHandler } from "../../core/asyncHandler.js";

import { FraudCase } from "../../models/FraudCase.model.js";

import { ApiResponse } from "../../core/apiResponse.js";

export const getFraudCases = asyncHandler(async (req, res) => {
  const cases = await FraudCase.find()

    .sort({ createdAt: -1 });

  res.json(ApiResponse.success(cases));
});

export const resolveFraudCase = asyncHandler(async (req, res) => {
  const fraud = await FraudCase.findById(req.params.id);

  fraud.status = "RESOLVED";

  fraud.resolvedBy = req.user._id;

  await fraud.save();

  res.json(ApiResponse.updated(fraud));
});
