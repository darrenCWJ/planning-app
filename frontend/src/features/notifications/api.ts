import { apiClient } from "../../lib/api-client";

export interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(limit?: number): Promise<NotificationData[]> {
  const resp = await apiClient.get("/api/notifications", { params: { limit: limit ?? 20 } });
  return resp.data.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const resp = await apiClient.get("/api/notifications/unread-count");
  return resp.data.data.count;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/api/notifications/${notificationId}/read`);
}

export async function markAllRead(): Promise<void> {
  await apiClient.post("/api/notifications/mark-all-read");
}
