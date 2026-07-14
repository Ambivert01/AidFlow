import { asyncHandler } from "../../core/asyncHandler.js";

import * as notificationService from "./notification.service.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotifications(req.user._id);

  res.json(result);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(
    req.params.id,
    req.user._id,
  );

  res.json(result);
});
