import { apiClient } from "../../lib/api-client";

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  task_count: number;
  completed_count: number;
}

export interface CreateSprintInput {
  name: string;
  start_date: string;
  end_date: string;
}

export interface UpdateSprintInput {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export async function fetchSprints(projectId: string): Promise<Sprint[]> {
  const resp = await apiClient.get(`/api/projects/${projectId}/sprints`);
  return resp.data.data;
}

export async function createSprint(
  projectId: string,
  data: CreateSprintInput
): Promise<Sprint> {
  const resp = await apiClient.post(`/api/projects/${projectId}/sprints`, data);
  return resp.data.data;
}

export async function updateSprint(
  sprintId: string,
  data: UpdateSprintInput
): Promise<Sprint> {
  const resp = await apiClient.patch(`/api/sprints/${sprintId}`, data);
  return resp.data.data;
}

export async function deleteSprint(sprintId: string): Promise<void> {
  await apiClient.delete(`/api/sprints/${sprintId}`);
}
