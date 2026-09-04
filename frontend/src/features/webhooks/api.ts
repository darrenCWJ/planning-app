import { apiClient } from "../../lib/api-client";

export type WebhookEvent =
  | "task.created"
  | "task.updated"
  | "task.moved"
  | "task.archived";

export interface Webhook {
  id: string;
  workspace_id: string;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  created_at: string;
}

export interface CreateWebhookInput {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export interface UpdateWebhookInput {
  url?: string;
  events?: WebhookEvent[];
  is_active?: boolean;
  secret?: string;
}

export async function fetchWebhooks(workspaceId: string): Promise<Webhook[]> {
  const resp = await apiClient.get(
    `/api/workspaces/${workspaceId}/webhooks`
  );
  return resp.data.data;
}

export async function createWebhook(
  workspaceId: string,
  data: CreateWebhookInput
): Promise<Webhook> {
  const resp = await apiClient.post(
    `/api/workspaces/${workspaceId}/webhooks`,
    data
  );
  return resp.data.data;
}

export async function updateWebhook(
  webhookId: string,
  data: UpdateWebhookInput
): Promise<Webhook> {
  const resp = await apiClient.patch(`/api/webhooks/${webhookId}`, data);
  return resp.data.data;
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  await apiClient.delete(`/api/webhooks/${webhookId}`);
}
