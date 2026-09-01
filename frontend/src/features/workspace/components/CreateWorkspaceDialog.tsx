import { useState } from "react";
import { useCreateWorkspace } from "../hooks/useWorkspaces";
import type { Workspace } from "../api";

interface CreateWorkspaceDialogProps {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

export function CreateWorkspaceDialog({
  onClose,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const mutation = useCreateWorkspace();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    const workspace = await mutation.mutateAsync({ name: trimmed });
    onCreated(workspace);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Create workspace
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="workspace-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Workspace name
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product Team"
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              Failed to create workspace. Please try again.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                         rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || name.trim().length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600
                         rounded-lg hover:bg-blue-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
