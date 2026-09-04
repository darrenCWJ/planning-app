import { apiClient } from "../../lib/api-client";

export interface DashboardTask {
  id: string;
  title: string;
  priority: string | null;
  due_date: string | null;
  project_name: string;
  project_key: string;
  project_id: string;
  column_id: string;
}

export interface DashboardData {
  assigned_tasks: DashboardTask[];
  overdue_tasks: DashboardTask[];
  due_this_week: DashboardTask[];
}

export async function fetchDashboard(): Promise<DashboardData> {
  const resp = await apiClient.get("/api/users/me/dashboard");
  return resp.data.data;
}
