import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRecurringRules,
  createRecurringRule,
  deleteRecurringRule,
  type RRuleOption,
} from "../api";

export function useRecurring(taskId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["recurring", taskId],
    queryFn: () => fetchRecurringRules(taskId),
    enabled: taskId.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (rrule: RRuleOption) => createRecurringRule(taskId, rrule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring", taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) => deleteRecurringRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring", taskId] });
    },
  });

  return { ...query, createMutation, deleteMutation };
}
