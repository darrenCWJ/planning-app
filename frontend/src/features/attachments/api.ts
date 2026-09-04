import { apiClient } from "../../lib/api-client";

export interface AttachmentData {
  id: string;
  workspace_id: string;
  task_id: string | null;
  kb_page_id: string | null;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export async function uploadAttachment(
  file: File,
  workspaceId: string,
  taskId?: string,
  kbPageId?: string
): Promise<AttachmentData> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspace_id", workspaceId);
  if (taskId) formData.append("task_id", taskId);
  if (kbPageId) formData.append("kb_page_id", kbPageId);
  const resp = await apiClient.post("/api/attachments/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return resp.data.data;
}

export async function fetchTaskAttachments(taskId: string): Promise<AttachmentData[]> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/attachments`);
  return resp.data.data;
}

export async function fetchKBAttachments(pageId: string): Promise<AttachmentData[]> {
  const resp = await apiClient.get(`/api/kb/${pageId}/attachments`);
  return resp.data.data;
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  await apiClient.delete(`/api/attachments/${attachmentId}`);
}

export function getDownloadUrl(attachmentId: string): string {
  const baseUrl = apiClient.defaults.baseURL ?? "";
  const token = localStorage.getItem("access_token");
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${baseUrl}/api/attachments/${attachmentId}/download${query}`;
}
