import { api } from "@/lib/api";

export const notificationService = {
  getNotifications: (page = 1) =>
    api.get(`/notifications?page=${page}`),

  markAsRead: (notification_id: number) =>
    api.postForm("/mark_notification_read", { notification_id }),
};
