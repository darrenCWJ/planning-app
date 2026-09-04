import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTaskAttachments,
  fetchKBAttachments,
  uploadAttachment,
  deleteAttachment,
} from "../api";

export function useTaskAttachments(taskId: string) {
  return useQuery({
    queryKey: ["attachments", "task", taskId],
    queryFn: () => fetchTaskAttachments(taskId),
    enabled: taskId.length > 0,
  });
}

export function useKBAttachments(pageId: string) {
  return useQuery({
    queryKey: ["attachments", "kb", pageId],
    queryFn: () => fetchKBAttachments(pageId),
    enabled: pageId.length > 0,
  });
}

interface UploadParams {
  file: File;
  workspaceId: string;
  taskId?: string;
  kbPageId?: string;
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, workspaceId, taskId, kbPageId }: UploadParams) =>
      uploadAttachment(file, workspaceId, taskId, kbPageId),
    onSuccess: (_data, variables) => {
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: ["attachments", "task", variables.taskId],
        });
      }
      if (variables.kbPageId) {
        queryClient.invalidateQueries({
          queryKey: ["attachments", "kb", variables.kbPageId],
        });
      }
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
    },
  });
}
