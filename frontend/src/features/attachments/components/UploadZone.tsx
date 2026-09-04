import { useState, useRef } from "react";
import { useUploadAttachment } from "../hooks/useAttachments";

interface UploadZoneProps {
  workspaceId: string;
  taskId?: string;
  kbPageId?: string;
  onUploadComplete?: () => void;
}

export function UploadZone({
  workspaceId,
  taskId,
  kbPageId,
  onUploadComplete,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAttachment();

  function handleFiles(files: FileList | null): void {
    if (!files || files.length === 0) return;
    const file = files[0];
    uploadMutation.mutate(
      { file, workspaceId, taskId, kbPageId },
      {
        onSuccess: () => {
          onUploadComplete?.();
        },
      }
    );
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(): void {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    handleFiles(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const borderColor = isDragOver ? "border-blue-500" : "border-gray-600";
  const bgColor = isDragOver ? "bg-gray-700" : "bg-gray-800";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploadMutation.isPending && inputRef.current?.click()}
      className={`cursor-pointer rounded-md border-2 border-dashed px-4 py-5 text-center transition-colors ${borderColor} ${bgColor}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleInputChange}
        disabled={uploadMutation.isPending}
      />

      {uploadMutation.isPending ? (
        <p className="text-sm text-blue-400">Uploading...</p>
      ) : (
        <p className="text-sm text-gray-400">
          Drop files here or{" "}
          <span className="text-blue-400 underline">click to upload</span>
        </p>
      )}

      {uploadMutation.isError && (
        <p className="mt-1 text-xs text-red-400">Upload failed. Please try again.</p>
      )}
    </div>
  );
}
