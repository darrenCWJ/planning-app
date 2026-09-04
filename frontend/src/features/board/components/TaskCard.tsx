import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { type TaskData } from "../api";
import { type WorkspaceMember } from "../../workspace/api";
import { DueDateBadge } from "./DueDateBadge";
import { useSubtasks } from "../../subtask/hooks/useSubtasks";
import { useDependencies } from "../../dependencies/hooks/useDependencies";

const PRIORITY_BORDER_COLORS: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-500",
  low: "border-l-gray-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface TaskCardProps {
  task: TaskData;
  onClick: () => void;
  workspaceId?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskCard({ task, onClick, workspaceId }: TaskCardProps) {
  const queryClient = useQueryClient();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  });

  const { data: subtasks } = useSubtasks(task.id);
  const subtaskTotal = subtasks?.length ?? 0;
  const subtaskDone = subtasks?.filter((s) => s.is_completed).length ?? 0;

  const { data: dependencies } = useDependencies(task.id);
  const hasDependencies = (dependencies?.length ?? 0) > 0;

  const members = workspaceId
    ? queryClient.getQueryData<WorkspaceMember[]>(["members", workspaceId])
    : undefined;
  const assignee =
    task.assignee_id != null
      ? (members?.find((m) => m.user_id === task.assignee_id) ?? null)
      : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor =
    PRIORITY_BORDER_COLORS[task.priority] ?? "border-l-gray-400";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 border-l-4 ${priorityColor} p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700`}
    >
      <p className="text-sm font-medium text-gray-900 leading-snug dark:text-white">
        {task.title}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
        <div className="flex items-center gap-1.5">
          {hasDependencies && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500"
              aria-label="Has dependencies"
              role="img"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
          {subtaskTotal > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ✓ {subtaskDone}/{subtaskTotal}
            </span>
          )}
          <DueDateBadge dueDate={task.due_date} />
          {assignee != null && (
            <span
              title={assignee.full_name}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white"
            >
              {getInitials(assignee.full_name)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
