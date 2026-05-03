import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as campaignController from "./campaign.controller.js";

import {
  createCampaignSchema,
  updateCampaignSchema,
} from "./campaign.validator.js";

const router = express.Router();

// NGO creates campaign

router.post(
  "/",

  authenticate,

  authorize("NGO"),

  validate(createCampaignSchema),

  campaignController.createCampaign,
);

// public sees active campaigns

router.get(
  "/",

  campaignController.getActiveCampaigns,
);

// campaign details

router.get(
  "/:id",

  campaignController.getCampaign,
);

// NGO updates campaign (only DRAFT or REJECTED)

router.patch(
  "/:id",

  authenticate,

  authorize("NGO"),

  validate(updateCampaignSchema),

  campaignController.updateCampaign,
);

// NGO submits campaign for approval

router.post(
  "/:id/submit",

  authenticate,

  authorize("NGO"),

  campaignController.submitCampaignForApproval,
);

// NGO deletes DRAFT campaign

router.delete(
  "/:id",

  authenticate,

  authorize("NGO"),

  campaignController.deleteCampaign,
);

export default router;
