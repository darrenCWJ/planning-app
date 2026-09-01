import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  type CreateProjectInput,
  type Project,
  createProject,
  fetchProjects,
} from "../api";

export function useProjects(workspaceId: string): UseQueryResult<Project[]> {
  return useQuery<Project[]>({
    queryKey: ["projects", workspaceId],
    queryFn: () => fetchProjects(workspaceId),
    enabled: workspaceId.length > 0,
  });
}

export function useCreateProject(
  workspaceId: string
): UseMutationResult<Project, Error, CreateProjectInput> {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: (data) => createProject(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "projects"] });
    },
  });
}
