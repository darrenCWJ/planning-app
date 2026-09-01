import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { type ColumnData } from "../api";
import { TaskCard } from "./TaskCard";

interface BoardColumnProps {
  column: ColumnData;
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
}

export function BoardColumn({ column, onTaskClick, onAddTask }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-lg bg-gray-100 p-3 ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{column.name}</h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
          {column.tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[2rem] flex-1 flex-col gap-2 overflow-y-auto"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </SortableContext>
      </div>

      <button
        type="button"
        onClick={onAddTask}
        className="mt-3 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        + Add task
      </button>
    </div>
  );
}
