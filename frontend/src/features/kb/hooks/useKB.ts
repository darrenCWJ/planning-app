import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createKBPage,
  deleteKBPage,
  fetchKBPage,
  fetchKBTree,
  updateKBPage,
  type CreateKBPageInput,
  type KBPageData,
  type KBTreeItem,
  type UpdateKBPageInput,
} from "../api";

export function useKBTree(workspaceId: string): UseQueryResult<KBTreeItem[]> {
  return useQuery<KBTreeItem[]>({
    queryKey: ["kb-tree", workspaceId],
    queryFn: () => fetchKBTree(workspaceId),
    enabled: workspaceId.length > 0,
  });
}

export function useKBPage(pageId: string | null): UseQueryResult<KBPageData> {
  return useQuery<KBPageData>({
    queryKey: ["kb-page", pageId],
    queryFn: () => fetchKBPage(pageId!),
    enabled: pageId != null && pageId.length > 0,
  });
}

export function useCreateKBPage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKBPageInput) =>
      createKBPage(workspaceId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["kb-tree", workspaceId] });
    },
  });
}

export function useUpdateKBPage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, input }: { pageId: string; input: UpdateKBPageInput }) =>
      updateKBPage(pageId, input),
    onSuccess: (_data, { pageId }) => {
      void queryClient.invalidateQueries({ queryKey: ["kb-tree", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["kb-page", pageId] });
    },
  });
}

export function useDeleteKBPage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pageId: string) => deleteKBPage(pageId),
    onSuccess: (_data, pageId) => {
      void queryClient.invalidateQueries({ queryKey: ["kb-tree", workspaceId] });
      void queryClient.invalidateQueries({ queryKey: ["kb-page", pageId] });
    },
  });
}
