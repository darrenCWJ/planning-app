import { useState } from "react";
import { useSubtasks } from "../hooks/useSubtasks";

interface SubtaskListProps {
  taskId: string;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const { data: subtasks, isLoading, createMutation, toggleMutation, deleteMutation } = useSubtasks(taskId);

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
    setNewTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  if (isLoading) return <div className="text-sm text-gray-400">Loading...</div>;

  const total = subtasks?.length ?? 0;
  const completed = subtasks?.filter((s) => s.is_completed).length ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Subtasks</h4>
        {total > 0 && (
          <span className="text-xs text-gray-500">{completed}/{total}</span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1.5 w-full rounded-full bg-gray-700">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}

      <ul className="space-y-1">
        {subtasks?.map((subtask) => (
          <li key={subtask.id} className="group flex items-center gap-2">
            <input
              type="checkbox"
              checked={subtask.is_completed}
              onChange={() =>
                toggleMutation.mutate({ id: subtask.id, is_completed: !subtask.is_completed })
              }
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className={`flex-1 text-sm ${subtask.is_completed ? "text-gray-500 line-through" : "text-gray-200"}`}>
              {subtask.title}
            </span>
            <button
              onClick={() => deleteMutation.mutate(subtask.id)}
              className="hidden text-gray-500 hover:text-red-400 group-hover:inline"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add subtask..."
          className="flex-1 rounded bg-gray-700 px-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
