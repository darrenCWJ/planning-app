import { useQuery } from "@tanstack/react-query";
import { fetchTaskActivity, fetchProjectActivity } from "../api";

export function useTaskActivity(taskId: string) {
  return useQuery({
    queryKey: ["activity", "task", taskId],
    queryFn: () => fetchTaskActivity(taskId),
    enabled: taskId.length > 0,
  });
}

export function useProjectActivity(projectId: string) {
  return useQuery({
    queryKey: ["activity", "project", projectId],
    queryFn: () => fetchProjectActivity(projectId),
    enabled: projectId.length > 0,
  });
}
