import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSubtasks, createSubtask, updateSubtask, deleteSubtask } from "../api";

export function useSubtasks(taskId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["subtasks", taskId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSubtasks(taskId),
    enabled: taskId.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createSubtask(taskId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      updateSubtask(id, { is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubtask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, createMutation, toggleMutation, deleteMutation };
}
