import express from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";

import * as notificationController from "./notification.controller.js";

const router = express.Router();

// user sees notifications

router.get(
  "/",

  authenticate,

  notificationController.getMyNotifications,
);

// mark notification read

router.patch(
  "/:id/read",

  authenticate,

  notificationController.markNotificationRead,
);

export default router;
