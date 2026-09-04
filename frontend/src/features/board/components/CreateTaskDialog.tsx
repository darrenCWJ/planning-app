import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../api";

interface CreateTaskDialogProps {
  projectId: string;
  columnId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;

export function CreateTaskDialog({
  projectId,
  columnId,
  isOpen,
  onClose,
}: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createTask(projectId, {
        title,
        priority,
        description: description || undefined,
        due_date: dueDate || null,
        column_id: columnId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      resetAndClose();
    },
  });

  function resetAndClose(): void {
    setTitle("");
    setPriority("medium");
    setDescription("");
    setDueDate("");
    onClose();
  }

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (title.trim().length === 0) return;
    mutation.mutate();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={resetAndClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          New Task
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Title <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
              placeholder="Task title"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
              placeholder="Optional description"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            />
          </label>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              Failed to create task. Please try again.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-md px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || title.trim().length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
