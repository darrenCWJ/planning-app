import { apiClient } from "../../lib/api-client";

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  description: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export interface TimeTotal {
  task_id: string;
  total_seconds: number;
}

export interface ManualLogData {
  description: string;
  duration_seconds: number;
  started_at: string;
}

export async function startTimer(taskId: string, description: string): Promise<TimeEntry> {
  const resp = await apiClient.post(`/api/tasks/${taskId}/time/start`, { description });
  return resp.data.data;
}

export async function stopTimer(entryId: string): Promise<TimeEntry> {
  const resp = await apiClient.post(`/api/time/${entryId}/stop`);
  return resp.data.data;
}

export async function logTime(taskId: string, data: ManualLogData): Promise<TimeEntry> {
  const resp = await apiClient.post(`/api/tasks/${taskId}/time/log`, data);
  return resp.data.data;
}

export async function fetchTimeEntries(taskId: string): Promise<TimeEntry[]> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/time`);
  return resp.data.data;
}

export async function fetchTimeTotal(taskId: string): Promise<TimeTotal> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/time/total`);
  return resp.data.data;
}

export async function deleteTimeEntry(entryId: string): Promise<void> {
  await apiClient.delete(`/api/time/${entryId}`);
}
