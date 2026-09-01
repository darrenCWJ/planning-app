import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTask, updateTask, deleteTask, type TaskData } from "../api";

interface TaskDetailModalProps {
  taskId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;

export function TaskDetailModal({
  taskId,
  projectId,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const { data: task, isLoading, isError } = useQuery<TaskData>({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    enabled: isOpen && taskId.length > 0,
  });

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  function enterEditMode(): void {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ?? "");
    setIsEditing(true);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      updateTask(taskId, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        due_date: editDueDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      handleClose();
    },
  });

  function handleClose(): void {
    setIsEditing(false);
    setIsConfirmingDelete(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <p className="text-sm text-gray-500">Loading task...</p>
        )}

        {isError && (
          <p className="text-sm text-red-600">Failed to load task.</p>
        )}

        {task && !isEditing && (
          <ViewMode
            task={task}
            onEdit={enterEditMode}
            onClose={handleClose}
            isConfirmingDelete={isConfirmingDelete}
            onToggleDelete={() => setIsConfirmingDelete((v) => !v)}
            onConfirmDelete={() => deleteMutation.mutate()}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {task && isEditing && (
          <EditMode
            editTitle={editTitle}
            editDescription={editDescription}
            editPriority={editPriority}
            editDueDate={editDueDate}
            onTitleChange={setEditTitle}
            onDescriptionChange={setEditDescription}
            onPriorityChange={setEditPriority}
            onDueDateChange={setEditDueDate}
            onSave={() => updateMutation.mutate()}
            onCancel={() => setIsEditing(false)}
            isSaving={updateMutation.isPending}
            saveError={updateMutation.isError}
          />
        )}
      </div>
    </div>
  );
}

interface ViewModeProps {
  task: TaskData;
  onEdit: () => void;
  onClose: () => void;
  isConfirmingDelete: boolean;
  onToggleDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

function ViewMode({
  task,
  onEdit,
  onClose,
  isConfirmingDelete,
  onToggleDelete,
  onConfirmDelete,
  isDeleting,
}: ViewModeProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          X
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-gray-500">Priority</span>
          <span className="capitalize text-gray-800">{task.priority}</span>
        </div>

        {task.due_date != null && (
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-gray-500">Due date</span>
            <span className="text-gray-800">{task.due_date}</span>
          </div>
        )}

        <div className="text-sm">
          <span className="font-medium text-gray-500">Description</span>
          <p className="mt-1 whitespace-pre-wrap text-gray-700">
            {task.description || "No description"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={onToggleDelete}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Are you sure?</span>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={isDeleting}
                className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={onToggleDelete}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Edit
        </button>
      </div>
    </>
  );
}

interface EditModeProps {
  editTitle: string;
  editDescription: string;
  editPriority: string;
  editDueDate: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  saveError: boolean;
}

function EditMode({
  editTitle,
  editDescription,
  editPriority,
  editDueDate,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onDueDateChange,
  onSave,
  onCancel,
  isSaving,
  saveError,
}: EditModeProps) {
  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit Task</h2>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Title</span>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Priority</span>
          <select
            value={editPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            Description
          </span>
          <textarea
            value={editDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Due date</span>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        {saveError && (
          <p className="text-sm text-red-600">
            Failed to save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || editTitle.trim().length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
