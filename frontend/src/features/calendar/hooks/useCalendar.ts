import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { type CalendarTask, fetchCalendarTasks } from "../api";

export function useCalendar(
  workspaceId: string,
  start: string,
  end: string
): UseQueryResult<CalendarTask[]> {
  return useQuery<CalendarTask[]>({
    queryKey: ["calendar", workspaceId, start, end],
    queryFn: () => fetchCalendarTasks(workspaceId, start, end),
    enabled: workspaceId.length > 0 && start.length > 0 && end.length > 0,
  });
}
