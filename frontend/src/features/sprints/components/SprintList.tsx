import { useState } from "react";
import {
  useSprints,
  useCreateSprint,
  useUpdateSprint,
  useDeleteSprint,
} from "../hooks/useSprints";
import type { Sprint } from "../api";

interface SprintListProps {
  projectId: string;
}

function SprintProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-xs text-gray-400">
        <span>{completed} / {total} tasks</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => {
    const dt = new Date(d);
    return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

interface SprintCardProps {
  sprint: Sprint;
  onToggleActive: (sprint: Sprint) => void;
  onDelete: (sprintId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function SprintCard({ sprint, onToggleActive, onDelete, isUpdating, isDeleting }: SprintCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        sprint.is_active
          ? "border-blue-600 bg-gray-800"
          : "border-gray-700 bg-gray-800"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-100">
              {sprint.name}
            </span>
            {sprint.is_active && (
              <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                Active
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-400">
            {formatDateRange(sprint.start_date, sprint.end_date)}
          </p>
          <SprintProgressBar
            completed={sprint.completed_count}
            total={sprint.task_count}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleActive(sprint)}
            disabled={isUpdating}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              sprint.is_active
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-blue-700 text-white hover:bg-blue-600"
            }`}
          >
            {sprint.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(sprint.id)}
            disabled={isDeleting}
            className="rounded px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-gray-700 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreateSprintFormProps {
  onSubmit: (name: string, startDate: string, endDate: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

function CreateSprintForm({ onSubmit, onCancel, isPending }: CreateSprintFormProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isValid = name.trim().length > 0 && startDate.length > 0 && endDate.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(name.trim(), startDate, endDate);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-600 bg-gray-800 p-4"
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-200">New Sprint</h3>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Sprint name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sprint 1"
            autoFocus
            className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-100
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-400">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-gray-100
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={!isValid || isPending}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white
                     hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isPending ? "Creating..." : "Create Sprint"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-1.5 text-sm text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SprintList({ projectId }: SprintListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { data: sprints, isLoading, isError } = useSprints(projectId);
  const createMutation = useCreateSprint(projectId);
  const updateMutation = useUpdateSprint(projectId);
  const deleteMutation = useDeleteSprint(projectId);

  const handleCreate = (name: string, startDate: string, endDate: string) => {
    createMutation.mutate(
      { name, start_date: startDate, end_date: endDate },
      { onSuccess: () => setIsCreating(false) }
    );
  };

  const handleToggleActive = (sprint: Sprint) => {
    updateMutation.mutate({
      sprintId: sprint.id,
      data: { is_active: !sprint.is_active },
    });
  };

  const handleDelete = (sprintId: string) => {
    deleteMutation.mutate(sprintId);
  };

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-gray-500">
        Loading sprints...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-red-400">
        Failed to load sprints.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-200">Sprints</h2>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white
                       hover:bg-blue-700 transition-colors"
          >
            + New Sprint
          </button>
        )}
      </div>

      {isCreating && (
        <CreateSprintForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
          isPending={createMutation.isPending}
        />
      )}

      {sprints && sprints.length === 0 && !isCreating && (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-700 text-sm text-gray-500">
          No sprints yet. Create one to get started.
        </div>
      )}

      {sprints && sprints.length > 0 && (
        <div className="space-y-2">
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              isUpdating={updateMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
