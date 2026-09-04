import { apiClient } from "../../lib/api-client";

export interface CalendarTask {
  id: string;
  title: string;
  priority: string | null;
  assignee_id: string | null;
  due_date: string;
  project_id: string;
  project_name: string;
  project_key: string;
  column_name: string;
}

export async function fetchCalendarTasks(
  workspaceId: string,
  start: string,
  end: string
): Promise<CalendarTask[]> {
  const resp = await apiClient.get(
    `/api/workspaces/${workspaceId}/calendar`,
    { params: { start, end } }
  );
  return resp.data.data;
}
