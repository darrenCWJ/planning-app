import { apiClient } from "../../lib/api-client";

export interface KBTreeItem {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  position: number;
  children: KBTreeItem[];
}

export interface KBPageData {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  content: string;
  created_by: string;
  updated_by: string | null;
  updated_by_name: string | null;
  position: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateKBPageInput {
  title: string;
  content: string;
  parent_id?: string | null;
}

export interface UpdateKBPageInput {
  title?: string;
  content?: string;
  parent_id?: string | null;
  position?: number;
}

export async function fetchKBTree(workspaceId: string): Promise<KBTreeItem[]> {
  const resp = await apiClient.get(`/api/workspaces/${workspaceId}/kb`);
  return resp.data.data ?? resp.data;
}

export async function fetchKBPage(pageId: string): Promise<KBPageData> {
  const resp = await apiClient.get(`/api/kb/${pageId}`);
  return resp.data.data ?? resp.data;
}

export async function createKBPage(
  workspaceId: string,
  input: CreateKBPageInput
): Promise<KBPageData> {
  const resp = await apiClient.post(
    `/api/workspaces/${workspaceId}/kb`,
    input
  );
  return resp.data.data ?? resp.data;
}

export async function updateKBPage(
  pageId: string,
  input: UpdateKBPageInput
): Promise<KBPageData> {
  const resp = await apiClient.patch(`/api/kb/${pageId}`, input);
  return resp.data.data ?? resp.data;
}

export async function deleteKBPage(pageId: string): Promise<void> {
  await apiClient.delete(`/api/kb/${pageId}`);
}
