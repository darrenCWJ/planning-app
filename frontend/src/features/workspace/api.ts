import { apiClient } from "../../lib/api-client";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email: string;
  full_name: string;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}

export interface InviteMemberInput {
  email: string;
  role: string;
}

export interface WorkspaceProject {
  id: string;
  workspace_id: string;
  name: string;
  key: string;
  description: string;
  is_archived: boolean;
  created_at: string;
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const resp = await apiClient.get("/api/workspaces");
  return resp.data.data;
}

export async function fetchWorkspace(id: string): Promise<Workspace> {
  const resp = await apiClient.get(`/api/workspaces/${id}`);
  return resp.data.data;
}

export async function createWorkspace(
  data: CreateWorkspaceInput
): Promise<Workspace> {
  const resp = await apiClient.post("/api/workspaces", data);
  return resp.data.data;
}

export async function fetchMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const resp = await apiClient.get(
    `/api/workspaces/${workspaceId}/members`
  );
  return resp.data.data;
}

export async function inviteMember(
  workspaceId: string,
  data: InviteMemberInput
): Promise<WorkspaceMember> {
  const resp = await apiClient.post(
    `/api/workspaces/${workspaceId}/members`,
    data
  );
  return resp.data.data;
}

export async function fetchWorkspaceProjects(
  workspaceId: string
): Promise<WorkspaceProject[]> {
  const resp = await apiClient.get(
    `/api/workspaces/${workspaceId}/projects`
  );
  return resp.data.data;
}
