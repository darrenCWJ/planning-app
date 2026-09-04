import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  type Webhook,
  type CreateWebhookInput,
  type UpdateWebhookInput,
} from "../api";

export function useWebhooks(workspaceId: string): UseQueryResult<Webhook[]> {
  return useQuery<Webhook[]>({
    queryKey: ["workspaces", workspaceId, "webhooks"],
    queryFn: () => fetchWebhooks(workspaceId),
    enabled: workspaceId.length > 0,
  });
}

export function useCreateWebhook(
  workspaceId: string
): UseMutationResult<Webhook, Error, CreateWebhookInput> {
  const queryClient = useQueryClient();

  return useMutation<Webhook, Error, CreateWebhookInput>({
    mutationFn: (data: CreateWebhookInput) =>
      createWebhook(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces", workspaceId, "webhooks"],
      });
    },
  });
}

interface UpdateWebhookVariables {
  webhookId: string;
  data: UpdateWebhookInput;
}

export function useUpdateWebhook(
  workspaceId: string
): UseMutationResult<Webhook, Error, UpdateWebhookVariables> {
  const queryClient = useQueryClient();

  return useMutation<Webhook, Error, UpdateWebhookVariables>({
    mutationFn: ({ webhookId, data }) => updateWebhook(webhookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces", workspaceId, "webhooks"],
      });
    },
  });
}

export function useDeleteWebhook(
  workspaceId: string
): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (webhookId: string) => deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspaces", workspaceId, "webhooks"],
      });
    },
  });
}
