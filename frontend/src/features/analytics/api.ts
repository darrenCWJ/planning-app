import { apiClient } from "../../lib/api-client";

export interface BurndownPoint {
  date: string;
  remaining: number;
  created: number;
  completed: number;
}

export interface VelocityPoint {
  week_start: string;
  week_end: string;
  completed: number;
}

export interface WorkloadEntry {
  user_id: string;
  full_name: string;
  task_count: number;
  active_count: number;
}

export async function fetchBurndown(
  projectId: string,
  days: number
): Promise<BurndownPoint[]> {
  const resp = await apiClient.get(
    `/api/projects/${projectId}/analytics/burndown`,
    { params: { days } }
  );
  return resp.data.data;
}

export async function fetchVelocity(
  projectId: string,
  weeks: number
): Promise<VelocityPoint[]> {
  const resp = await apiClient.get(
    `/api/projects/${projectId}/analytics/velocity`,
    { params: { weeks } }
  );
  return resp.data.data;
}

export async function fetchWorkload(
  workspaceId: string
): Promise<WorkloadEntry[]> {
  const resp = await apiClient.get(
    `/api/workspaces/${workspaceId}/analytics/workload`
  );
  return resp.data.data;
}
