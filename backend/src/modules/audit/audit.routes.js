import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import * as auditController from "./audit.controller.js";

const router = express.Router();

// public transparency

router.get(
  "/campaign/:campaignId",

  auditController.getCampaignAudit,
);

// admin audit access

router.get(
  "/entity/:entityId",

  authenticate,

  authorize("ADMIN", "GOVERNMENT"),

  auditController.getEntityAudit,
);

// finalize workflow

router.post(
  "/finalize/:jobIdHash",

  authenticate,

  authorize("ADMIN"),

  auditController.finalizeAudit,
);

router.get(
 "/search",
 authenticate,
 authorize("ADMIN"),
 auditController.searchAudit
);

export default router;
