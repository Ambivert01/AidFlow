import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as proofController from "./proof.controller.js";

import { uploadProofSchema } from "./proof.validator.js";

const router = express.Router();

// NGO uploads proof

router.post(
  "/",

  authenticate,

  authorize("NGO"),

  validate(uploadProofSchema),

  proofController.uploadProof,
);

// public transparency

router.get(
  "/donation/:donationId",

  proofController.getProofs,
);

export default router;
