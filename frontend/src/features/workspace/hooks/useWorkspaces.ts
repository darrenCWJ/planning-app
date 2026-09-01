import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  fetchWorkspaces,
  createWorkspace,
  type Workspace,
  type CreateWorkspaceInput,
} from "../api";

const WORKSPACES_KEY = ["workspaces"] as const;

export function useWorkspaces(): UseQueryResult<Workspace[]> {
  return useQuery<Workspace[]>({
    queryKey: WORKSPACES_KEY,
    queryFn: fetchWorkspaces,
  });
}

export function useCreateWorkspace(): UseMutationResult<
  Workspace,
  Error,
  CreateWorkspaceInput
> {
  const queryClient = useQueryClient();

  return useMutation<Workspace, Error, CreateWorkspaceInput>({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
  });
}
