import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  fetchWorkspace,
  fetchMembers,
  inviteMember,
  fetchWorkspaceProjects,
  type Workspace,
  type WorkspaceMember,
  type InviteMemberInput,
  type WorkspaceProject,
} from "../api";

export function useWorkspace(id: string): UseQueryResult<Workspace> {
  return useQuery<Workspace>({
    queryKey: ["workspaces", id],
    queryFn: () => fetchWorkspace(id),
    enabled: id.length > 0,
  });
}

export function useMembers(
  workspaceId: string
): UseQueryResult<WorkspaceMember[]> {
  return useQuery<WorkspaceMember[]>({
    queryKey: ["workspaces", workspaceId, "members"],
    queryFn: () => fetchMembers(workspaceId),
    enabled: workspaceId.length > 0,
  });
}

export function useWorkspaceProjects(
  workspaceId: string
): UseQueryResult<WorkspaceProject[]> {
  return useQuery<WorkspaceProject[]>({
    queryKey: ["workspaces", workspaceId, "projects"],
    queryFn: () => fetchWorkspaceProjects(workspaceId),
    enabled: workspaceId.length > 0,
  });
}

export function useInviteMember(
  workspaceId: string
): UseMutationResult<WorkspaceMember, Error, InviteMemberInput> {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceMember, Error, InviteMemberInput>({
    mutationFn: (data: InviteMemberInput) => inviteMember(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces", workspaceId, "members"],
      });
    },
  });
}
