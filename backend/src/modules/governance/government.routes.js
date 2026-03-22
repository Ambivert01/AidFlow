import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import { authorize } from "../../middlewares/authorize.middleware.js";

import * as govController from "./government.controller.js";

const router = express.Router();

router.patch(
  "/donations/:id/review",

  authenticate,

  authorize("GOVERNMENT"),

  govController.reviewDonation,
);

export default router;
