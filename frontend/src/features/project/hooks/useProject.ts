import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  type Project,
  type UpdateProjectInput,
  fetchProject,
  updateProject,
} from "../api";

export function useProject(projectId: string): UseQueryResult<Project> {
  return useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: projectId.length > 0,
  });
}

export function useUpdateProject(): UseMutationResult<
  Project,
  Error,
  { projectId: string; data: UpdateProjectInput }
> {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { projectId: string; data: UpdateProjectInput }
  >({
    mutationFn: ({ projectId, data }) => updateProject(projectId, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({
        queryKey: ["project", updatedProject.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", updatedProject.workspace_id],
      });
    },
  });
}
