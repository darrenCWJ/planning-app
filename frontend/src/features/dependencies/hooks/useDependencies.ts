import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDependencies, addDependency, removeDependency } from "../api";

export function useDependencies(taskId: string) {
  return useQuery({
    queryKey: ["dependencies", taskId],
    queryFn: () => fetchDependencies(taskId),
    enabled: taskId.length > 0,
  });
}

export function useAddDependency(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockedByTaskId: string) => addDependency(taskId, blockedByTaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependencies", taskId] });
    },
  });
}

export function useRemoveDependency(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dependencyId: string) => removeDependency(dependencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dependencies", taskId] });
    },
  });
}
