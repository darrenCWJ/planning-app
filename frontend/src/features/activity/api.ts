import { apiClient } from "../../lib/api-client";

export interface ActivityData {
  id: string;
  workspace_id: string;
  project_id: string | null;
  task_id: string | null;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
  actor_name: string | null;
}

export async function fetchTaskActivity(
  taskId: string,
  limit?: number
): Promise<ActivityData[]> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/activity`, {
    params: { limit: limit ?? 20 },
  });
  return resp.data.data;
}

export async function fetchProjectActivity(
  projectId: string,
  limit?: number
): Promise<ActivityData[]> {
  const resp = await apiClient.get(`/api/projects/${projectId}/activity`, {
    params: { limit: limit ?? 20 },
  });
  return resp.data.data;
}
