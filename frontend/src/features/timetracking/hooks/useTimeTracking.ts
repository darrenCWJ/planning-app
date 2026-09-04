import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  startTimer,
  stopTimer,
  logTime,
  fetchTimeEntries,
  fetchTimeTotal,
  deleteTimeEntry,
  type ManualLogData,
} from "../api";

export function useTimeTracking(taskId: string) {
  const queryClient = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ["time-entries", taskId],
    queryFn: () => fetchTimeEntries(taskId),
    enabled: taskId.length > 0,
  });

  const totalQuery = useQuery({
    queryKey: ["time-total", taskId],
    queryFn: () => fetchTimeTotal(taskId),
    enabled: taskId.length > 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["time-entries", taskId] });
    queryClient.invalidateQueries({ queryKey: ["time-total", taskId] });
  };

  const startMutation = useMutation({
    mutationFn: (description: string) => startTimer(taskId, description),
    onSuccess: invalidate,
  });

  const stopMutation = useMutation({
    mutationFn: (entryId: string) => stopTimer(entryId),
    onSuccess: invalidate,
  });

  const logMutation = useMutation({
    mutationFn: (data: ManualLogData) => logTime(taskId, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteTimeEntry(entryId),
    onSuccess: invalidate,
  });

  return {
    ...entriesQuery,
    total: totalQuery.data,
    startMutation,
    stopMutation,
    logMutation,
    deleteMutation,
  };
}
