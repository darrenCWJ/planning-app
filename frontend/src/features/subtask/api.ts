import { apiClient } from "../../lib/api-client";

export interface SubtaskData {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export async function fetchSubtasks(taskId: string): Promise<SubtaskData[]> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/subtasks`);
  return resp.data.data;
}

export async function createSubtask(taskId: string, title: string): Promise<SubtaskData> {
  const resp = await apiClient.post(`/api/tasks/${taskId}/subtasks`, { title });
  return resp.data.data;
}

export async function updateSubtask(subtaskId: string, data: { title?: string; is_completed?: boolean }): Promise<SubtaskData> {
  const resp = await apiClient.patch(`/api/subtasks/${subtaskId}`, data);
  return resp.data.data;
}

export async function deleteSubtask(subtaskId: string): Promise<void> {
  await apiClient.delete(`/api/subtasks/${subtaskId}`);
}

export async function reorderSubtasks(taskId: string, items: { id: string; position: number }[]): Promise<SubtaskData[]> {
  const resp = await apiClient.put(`/api/tasks/${taskId}/subtasks/reorder`, { items });
  return resp.data.data;
}
