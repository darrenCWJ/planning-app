import { apiClient } from "../../lib/api-client";

export interface RecurringRule {
  id: string;
  task_id: string;
  project_id: string;
  rrule: string;
  next_run_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export type RRuleOption = "daily" | "weekly" | "biweekly" | "monthly";

export async function fetchRecurringRules(taskId: string): Promise<RecurringRule[]> {
  const resp = await apiClient.get(`/api/tasks/${taskId}/recurring`);
  return resp.data.data;
}

export async function createRecurringRule(
  taskId: string,
  rrule: RRuleOption
): Promise<RecurringRule> {
  const resp = await apiClient.post(`/api/tasks/${taskId}/recurring`, { rrule });
  return resp.data.data;
}

export async function deleteRecurringRule(ruleId: string): Promise<void> {
  await apiClient.delete(`/api/recurring/${ruleId}`);
}
