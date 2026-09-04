import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnData, TaskData } from "../api";
import type { WorkspaceMember } from "../../workspace/api";
import { DueDateBadge } from "./DueDateBadge";
import { useSubtasks } from "../../subtask/hooks/useSubtasks";

type SortField = "title" | "status" | "priority" | "due_date";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PRIORITY_BADGE_COLORS: Record<string, string> = {
  urgent: "bg-red-900 text-red-300",
  high: "bg-orange-900 text-orange-300",
  medium: "bg-yellow-900 text-yellow-300",
  low: "bg-blue-900 text-blue-300",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface FlatTask extends TaskData {
  columnName: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ListRowProps {
  task: FlatTask;
  assignee: WorkspaceMember | null;
  onClick: () => void;
}

function ListRow({ task, assignee, onClick }: ListRowProps) {
  const { data: subtasks } = useSubtasks(task.id);
  const subtaskTotal = subtasks?.length ?? 0;
  const subtaskDone = subtasks?.filter((s) => s.is_completed).length ?? 0;

  const badgeColor =
    PRIORITY_BADGE_COLORS[task.priority] ?? "bg-gray-700 text-gray-300";
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority;

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
    >
      <td className="px-4 py-3 text-sm font-medium text-gray-200">
        {task.title}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">{task.columnName}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${badgeColor}`}
        >
          {priorityLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        {assignee != null ? (
          <span
            title={assignee.full_name}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white"
          >
            {getInitials(assignee.full_name)}
          </span>
        ) : (
          <span className="text-gray-600 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {task.due_date != null ? (
          <DueDateBadge dueDate={task.due_date} />
        ) : (
          <span className="text-gray-600 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        {subtaskTotal > 0 ? `${subtaskDone}/${subtaskTotal}` : "—"}
      </td>
    </tr>
  );
}

interface HeaderConfig {
  label: string;
  sortField: SortField | null;
}

const HEADERS: HeaderConfig[] = [
  { label: "Title", sortField: "title" },
  { label: "Status", sortField: "status" },
  { label: "Priority", sortField: "priority" },
  { label: "Assignee", sortField: null },
  { label: "Due Date", sortField: "due_date" },
  { label: "Subtasks", sortField: null },
];

export interface ListViewProps {
  columns: ColumnData[];
  onTaskClick: (taskId: string) => void;
  workspaceId: string;
}

export function ListView({ columns, onTaskClick, workspaceId }: ListViewProps) {
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const members =
    queryClient.getQueryData<WorkspaceMember[]>(["members", workspaceId]) ?? [];

  const flatTasks = useMemo<FlatTask[]>(
    () =>
      columns.flatMap((col) =>
        col.tasks.map((task) => ({ ...task, columnName: col.name }))
      ),
    [columns]
  );

  const sorted = useMemo<FlatTask[]>(() => {
    return [...flatTasks].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "status":
          cmp = a.columnName.localeCompare(b.columnName);
          break;
        case "priority":
          cmp =
            (PRIORITY_ORDER[a.priority] ?? 99) -
            (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case "due_date": {
          const aMs = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bMs = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          cmp = aMs - bMs;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [flatTasks, sortField, sortDir]);

  function handleHeaderClick(field: SortField | null) {
    if (field == null) return;
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  if (flatTasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">
          No tasks match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <table className="w-full bg-gray-900 text-left">
          <thead className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900">
            <tr>
              {HEADERS.map((h) => {
                const isActive =
                  h.sortField != null && sortField === h.sortField;
                const isSortable = h.sortField != null;
                return (
                  <th
                    key={h.label}
                    onClick={() => handleHeaderClick(h.sortField)}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 ${
                      isSortable
                        ? "cursor-pointer select-none hover:text-gray-200"
                        : ""
                    }`}
                  >
                    {h.label}
                    {isSortable && (
                      <span
                        className={`ml-1 ${
                          isActive ? "text-blue-400" : "text-gray-600"
                        }`}
                      >
                        {isActive ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const assignee =
                task.assignee_id != null
                  ? (members.find((m) => m.user_id === task.assignee_id) ??
                    null)
                  : null;
              return (
                <ListRow
                  key={task.id}
                  task={task}
                  assignee={assignee}
                  onClick={() => onTaskClick(task.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
