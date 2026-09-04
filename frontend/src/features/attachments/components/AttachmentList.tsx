import { useState } from "react";
import { useTaskAttachments, useDeleteAttachment } from "../hooks/useAttachments";
import { getDownloadUrl, type AttachmentData } from "../api";

interface AttachmentListProps {
  taskId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function fileTypeLabel(contentType: string): string {
  if (contentType.startsWith("image/")) return "[img]";
  if (contentType === "application/pdf") return "[pdf]";
  if (contentType.startsWith("video/")) return "[vid]";
  if (contentType.startsWith("audio/")) return "[aud]";
  if (
    contentType === "application/zip" ||
    contentType === "application/x-zip-compressed"
  )
    return "[zip]";
  if (contentType.includes("spreadsheet") || contentType.includes("excel"))
    return "[xls]";
  if (contentType.includes("word") || contentType.includes("document"))
    return "[doc]";
  return "[file]";
}

interface AttachmentRowProps {
  attachment: AttachmentData;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function AttachmentRow({ attachment, onDelete, isDeleting }: AttachmentRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const downloadUrl = getDownloadUrl(attachment.id);
  const isImage = attachment.content_type.startsWith("image/");

  return (
    <li className="rounded-md bg-gray-800 p-2">
      {isImage && (
        <img
          src={downloadUrl}
          alt={attachment.original_filename}
          className="mb-2 max-h-32 w-full rounded object-contain"
        />
      )}

      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded bg-gray-700 px-1.5 py-0.5 text-xs font-mono text-gray-400">
          {fileTypeLabel(attachment.content_type)}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm text-gray-200"
            title={attachment.original_filename}
          >
            {attachment.original_filename}
          </p>
          <p className="text-xs text-gray-500">
            {formatSize(attachment.size_bytes)} &middot;{" "}
            {formatRelativeTime(attachment.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-gray-700 hover:text-blue-300 transition-colors"
          >
            Download
          </a>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-700 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDelete(attachment.id)}
                disabled={isDeleting}
                className="rounded bg-red-700 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "..." : "Yes"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function AttachmentList({ taskId }: AttachmentListProps) {
  const { data: attachments, isLoading } = useTaskAttachments(taskId);
  const deleteMutation = useDeleteAttachment();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading attachments...</p>;
  }

  const list = attachments ?? [];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-300">Attachments</h4>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500">No attachments</p>
      ) : (
        <ul className="space-y-1">
          {list.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
