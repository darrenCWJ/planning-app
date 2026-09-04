import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDependencies, useAddDependency, useRemoveDependency } from "../hooks/useDependencies";
import { fetchProjectTasks, type TaskSummary } from "../api";

interface DependencyListProps {
  taskId: string;
  projectId: string;
}

export function DependencyList({ taskId, projectId }: DependencyListProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: dependencies, isLoading } = useDependencies(taskId);
  const addMutation = useAddDependency(taskId);
  const removeMutation = useRemoveDependency(taskId);

  const { data: projectTasks } = useQuery<TaskSummary[]>({
    queryKey: ["projectTasks", projectId],
    queryFn: () => fetchProjectTasks(projectId),
    enabled: isPickerOpen && projectId.length > 0,
  });

  const existingBlockerIds = new Set(
    dependencies?.map((d) => d.blocked_by_task_id) ?? []
  );

  const filteredTasks =
    projectTasks?.filter(
      (t) =>
        t.id !== taskId &&
        !existingBlockerIds.has(t.id) &&
        t.title.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  function handleAddDependency(blockerTaskId: string): void {
    addMutation.mutate(blockerTaskId, {
      onSuccess: () => {
        setIsPickerOpen(false);
        setSearch("");
      },
    });
  }

  function handleRemove(dependencyId: string): void {
    removeMutation.mutate(dependencyId);
  }

  function handleOpenPicker(): void {
    setIsPickerOpen((prev) => !prev);
    setSearch("");
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading dependencies...</div>;
  }

  const dependencyCount = dependencies?.length ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ChainIcon className="h-3.5 w-3.5 text-gray-400" />
          <h4 className="text-sm font-medium text-gray-300">Blocked by</h4>
          {dependencyCount > 0 && (
            <span className="rounded-full bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">
              {dependencyCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleOpenPicker}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {isPickerOpen ? "Cancel" : "+ Add"}
        </button>
      </div>

      {dependencyCount > 0 && (
        <ul className="space-y-1">
          {dependencies?.map((dep) => (
            <li
              key={dep.id}
              className="group flex items-center justify-between gap-2 rounded bg-gray-700/50 px-2 py-1.5"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ChainIcon className="h-3 w-3 shrink-0 text-gray-500" />
                <span className="truncate text-sm text-gray-200">
                  {dep.blocked_by_title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(dep.id)}
                disabled={removeMutation.isPending}
                className="shrink-0 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Remove dependency"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {dependencyCount === 0 && !isPickerOpen && (
        <p className="text-xs text-gray-500">No blocking tasks</p>
      )}

      {isPickerOpen && (
        <div className="rounded-md border border-gray-600 bg-gray-800">
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              autoFocus
              className="w-full rounded bg-gray-700 px-2 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filteredTasks.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                {projectTasks == null ? "Loading tasks..." : "No tasks found"}
              </li>
            ) : (
              filteredTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => handleAddDependency(task.id)}
                    disabled={addMutation.isPending}
                    className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {task.title}
                  </button>
                </li>
              ))
            )}
          </ul>
          {addMutation.isError && (
            <p className="px-3 py-2 text-xs text-red-400 border-t border-gray-700">
              Failed to add dependency. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ChainIconProps {
  className?: string;
}

function ChainIcon({ className }: ChainIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
