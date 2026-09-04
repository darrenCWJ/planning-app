import { type FormEvent, useState } from "react";
import { useCreateProject } from "../hooks/useProjects";

interface CreateProjectDialogProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export function CreateProjectDialog({
  workspaceId,
  isOpen,
  onClose,
  onCreated,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const createMutation = useCreateProject(workspaceId);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setError("Project name is required.");
      return;
    }

    try {
      const key = trimmedName.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 10);
      const project = await createMutation.mutateAsync({
        name: trimmedName,
        key,
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      onCreated(project.id);
      onClose();
    } catch {
      setError("Failed to create project. Please try again.");
    }
  };

  const handleOverlayClick = () => {
    if (!createMutation.isPending) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          New Project
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="project-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
              <span className="text-gray-400 font-normal ml-1">
                (optional)
              </span>
            </label>
            <textarea
              id="project-description"
              placeholder="A brief description of the project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
