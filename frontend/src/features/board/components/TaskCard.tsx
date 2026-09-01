import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type TaskData } from "../api";

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
}

export function TaskCard({ task, onClick }: TaskCardProps) {
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
      className={`bg-white rounded-lg border border-gray-200 border-l-4 ${priorityColor} p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
    >
      <p className="text-sm font-medium text-gray-900 leading-snug">
        {task.title}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
        {task.due_date != null && (
          <span className="text-xs text-gray-500">{task.due_date}</span>
        )}
      </div>
    </div>
  );
}
