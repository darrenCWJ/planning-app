import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  fetchSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  type Sprint,
  type CreateSprintInput,
  type UpdateSprintInput,
} from "../api";

export function useSprints(projectId: string): UseQueryResult<Sprint[]> {
  return useQuery<Sprint[]>({
    queryKey: ["sprints", projectId],
    queryFn: () => fetchSprints(projectId),
    enabled: projectId.length > 0,
  });
}

export function useCreateSprint(
  projectId: string
): UseMutationResult<Sprint, Error, CreateSprintInput> {
  const queryClient = useQueryClient();
  return useMutation<Sprint, Error, CreateSprintInput>({
    mutationFn: (data) => createSprint(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
    },
  });
}

export function useUpdateSprint(
  projectId: string
): UseMutationResult<Sprint, Error, { sprintId: string; data: UpdateSprintInput }> {
  const queryClient = useQueryClient();
  return useMutation<Sprint, Error, { sprintId: string; data: UpdateSprintInput }>({
    mutationFn: ({ sprintId, data }) => updateSprint(sprintId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
    },
  });
}

export function useDeleteSprint(
  projectId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (sprintId) => deleteSprint(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
    },
  });
}
