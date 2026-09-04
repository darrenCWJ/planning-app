import { apiClient } from "../../lib/api-client";

export interface DependencyData {
  id: string;
  task_id: string;
  blocked_by_task_id: string;
  blocked_by_title: string;
  created_at: string;
}

export interface TaskSummary {
  id: string;
  title: string;
}

export async function fetchDependencies(taskId: string): Promise<DependencyData[]> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/dependencies`);
  return resp.data.data;
}

export async function addDependency(
  taskId: string,
  blockedByTaskId: string
): Promise<DependencyData> {
  const resp = await apiClient.post(`/api/tasks/${taskId}/dependencies`, {
    blocked_by_task_id: blockedByTaskId,
  });
  return resp.data.data;
}

export async function removeDependency(dependencyId: string): Promise<void> {
  await apiClient.delete(`/api/dependencies/${dependencyId}`);
}

export async function fetchProjectTasks(projectId: string): Promise<TaskSummary[]> {
  const resp = await apiClient.get(`/api/projects/${projectId}/tasks`);
  return resp.data.data;
}
