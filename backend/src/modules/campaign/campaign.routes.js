import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import * as campaignController from "./campaign.controller.js";

import { createCampaignSchema } from "./campaign.validator.js";

const router = express.Router();

// NGO creates campaign

router.post(
  "/",

  authenticate,

  authorize("NGO"),

  validate(createCampaignSchema),

  campaignController.createCampaign,
);

// NGO activates campaign

router.patch(
  "/:id/activate",

  authenticate,

  authorize("NGO"),

  campaignController.activateCampaign,
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

export default router;
