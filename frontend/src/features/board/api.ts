import { apiClient } from "../../lib/api-client";

export interface TaskData {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description: string;
  priority: string;
  assignee_id: string | null;
  position: string;
  due_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ColumnData {
  id: string;
  name: string;
  position: string;
  tasks: TaskData[];
}

export interface BoardData {
  project_id: string;
  columns: ColumnData[];
}

export interface CreateTaskInput {
  title: string;
  priority: string;
  description?: string;
  due_date?: string | null;
  column_id?: string;
}

export async function fetchBoard(projectId: string): Promise<BoardData> {
  const resp = await apiClient.get(`/api/projects/${projectId}/board`);
  return resp.data.data;
}

export async function moveTask(
  taskId: string,
  columnId: string,
  position: string
): Promise<TaskData> {
  const resp = await apiClient.post(`/api/tasks/${taskId}/move`, {
    column_id: columnId,
    position,
  });
  return resp.data.data;
}

export async function createTask(
  projectId: string,
  data: CreateTaskInput
): Promise<TaskData> {
  const resp = await apiClient.post(`/api/projects/${projectId}/tasks`, data);
  return resp.data.data;
}

export async function fetchTask(taskId: string): Promise<TaskData> {
  const resp = await apiClient.get(`/api/tasks/${taskId}`);
  return resp.data.data;
}

export async function updateTask(
  taskId: string,
  data: Partial<Pick<TaskData, "title" | "description" | "priority" | "due_date" | "assignee_id">>
): Promise<TaskData> {
  const resp = await apiClient.patch(`/api/tasks/${taskId}`, data);
  return resp.data.data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${taskId}`);
}

export interface ColumnInput {
  name: string;
}

export async function createColumn(
  projectId: string,
  data: ColumnInput
): Promise<ColumnData> {
  const resp = await apiClient.post(`/api/projects/${projectId}/columns`, data);
  return resp.data.data;
}

export async function updateColumn(
  columnId: string,
  data: { name: string }
): Promise<ColumnData> {
  const resp = await apiClient.patch(`/api/columns/${columnId}`, data);
  return resp.data.data;
}

export async function reorderColumns(
  projectId: string,
  columnIds: string[]
): Promise<ColumnData[]> {
  const resp = await apiClient.put(`/api/projects/${projectId}/columns/reorder`, {
    column_ids: columnIds,
  });
  return resp.data.data;
}

export async function deleteColumn(columnId: string): Promise<void> {
  await apiClient.delete(`/api/columns/${columnId}`);
}

export interface CommentData {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export async function fetchComments(taskId: string): Promise<CommentData[]> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/comments`);
  return resp.data.data;
}

export async function createComment(
  taskId: string,
  content: string
): Promise<CommentData> {
  const resp = await apiClient.post(`/api/tasks/${taskId}/comments`, {
    content,
  });
  return resp.data.data;
}
