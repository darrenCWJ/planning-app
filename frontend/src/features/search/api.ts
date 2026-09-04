import { apiClient } from "../../lib/api-client";

export interface SearchTaskResult {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  assignee_id: string | null;
  due_date: string | null;
}

export interface SearchProjectGroup {
  project_id: string;
  project_name: string;
  project_key: string;
  tasks: SearchTaskResult[];
}

export interface SearchResults {
  projects: SearchProjectGroup[];
}

export async function searchTasks(workspaceId: string, query: string): Promise<SearchResults> {
  const resp = await apiClient.get(`/api/workspaces/${workspaceId}/search`, { params: { q: query, limit: 20 } });
  return resp.data.data;
}
