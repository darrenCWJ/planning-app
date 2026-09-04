import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ColumnData } from "../api";
import { TaskCard } from "./TaskCard";

interface BoardColumnProps {
  column: ColumnData;
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
  onRename: (columnId: string, name: string) => void;
  onDelete: (columnId: string) => void;
  workspaceId?: string;
}

export function BoardColumn({
  column,
  onTaskClick,
  onAddTask,
  onRename,
  onDelete,
  workspaceId,
}: BoardColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: { type: "column", column },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRenameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed.length > 0 && trimmed !== column.name) {
      onRename(column.id, trimmed);
    }
    setIsEditing(false);
    setEditName(column.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(column.name);
    }
  };

  const taskIds = column.tasks.map((t) => t.id);
  const hasActiveTasks = column.tasks.length > 0;

  const columnStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setSortRef}
      style={columnStyle}
      className={`flex w-72 shrink-0 flex-col rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div
        className="mb-3 flex items-center justify-between cursor-grab"
        {...attributes}
        {...listeners}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full rounded border border-blue-400 bg-white px-2 py-0.5 text-sm font-semibold text-gray-700 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
          />
        ) : (
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{column.name}</h3>
        )}

        <div className="flex items-center gap-1">
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {column.tasks.length}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setEditName(column.name);
                      setIsEditing(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    disabled={hasActiveTasks}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(column.id);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50
                               disabled:text-gray-300 disabled:hover:bg-white disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        ref={setDropRef}
        className="flex min-h-[2rem] flex-1 flex-col gap-2 overflow-y-auto"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              workspaceId={workspaceId}
            />
          ))}
        </SortableContext>
      </div>

      <button
        type="button"
        onClick={onAddTask}
        className="mt-3 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
      >
        + Add task
      </button>
    </div>
  );
}
