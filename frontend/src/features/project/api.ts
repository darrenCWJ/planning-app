import { apiClient } from "../../lib/api-client";

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  key: string;
  description: string;
  is_archived: boolean;
  created_at: string;
}

export interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export async function fetchProjects(workspaceId: string): Promise<Project[]> {
  const resp = await apiClient.get(
    `/api/workspaces/${workspaceId}/projects`
  );
  return resp.data.data;
}

export async function fetchProject(projectId: string): Promise<Project> {
  const resp = await apiClient.get(`/api/projects/${projectId}`);
  return resp.data.data;
}

export async function createProject(
  workspaceId: string,
  data: CreateProjectInput
): Promise<Project> {
  const resp = await apiClient.post(
    `/api/workspaces/${workspaceId}/projects`,
    data
  );
  return resp.data.data;
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectInput
): Promise<Project> {
  const resp = await apiClient.patch(`/api/projects/${projectId}`, data);
  return resp.data.data;
}
