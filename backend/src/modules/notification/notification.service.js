import { Notification } from "../../models/system/Notification.model.js";

import { BaseService } from "../../core/base.service.js";
import { AppError } from "../../utils/AppError.js";

export const createNotification = async (data) => {
  const notification = await Notification.create({
    recipient: data.userId,

    role: data.role,

    type: data.type,

    title: data.title,

    message: data.message,

    entityType: data.entityType,

    entityId: data.entityId,

    channels: data.channels || ["IN_APP"],

    priority: data.priority || "NORMAL",
  });

  return notification;
};

export const getMyNotifications = async (userId) => {
  const notifications = await Notification.find({
    recipient: userId,
  }).sort({ createdAt: -1 });

  return BaseService.success(notifications);
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return BaseService.updated(notification);
};
