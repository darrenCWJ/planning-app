import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import {
  type BoardData,
  type TaskData,
  moveTask,
} from "../api";

interface UseBoardDndResult {
  activeTask: TaskData | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useBoardDnd(
  projectId: string,
  board: BoardData | undefined
): UseBoardDndResult {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as TaskData | undefined;
    setActiveTask(task ?? null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !board) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;

      const sourceCol = board.columns.find((col) =>
        col.tasks.some((t) => t.id === activeId)
      );
      const overCol =
        board.columns.find((col) => col.id === overId) ??
        board.columns.find((col) => col.tasks.some((t) => t.id === overId));

      if (!sourceCol || !overCol || sourceCol.id === overCol.id) return;

      queryClient.setQueryData<BoardData>(["board", projectId], (old) => {
        if (!old) return old;

        const task = sourceCol.tasks.find((t) => t.id === activeId);
        if (!task) return old;

        const columns = old.columns.map((col) => {
          if (col.id === sourceCol.id) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
          }
          if (col.id === overCol.id) {
            const overIndex = col.tasks.findIndex((t) => t.id === overId);
            const insertIndex = overIndex >= 0 ? overIndex : col.tasks.length;
            const updatedTasks = [...col.tasks];
            updatedTasks.splice(insertIndex, 0, { ...task, column_id: overCol.id });
            return { ...col, tasks: updatedTasks };
          }
          return col;
        });

        return { ...old, columns };
      });
    },
    [board, projectId, queryClient]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !board) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const currentBoard = queryClient.getQueryData<BoardData>(["board", projectId]);
      if (!currentBoard) return;

      const targetCol =
        currentBoard.columns.find((col) => col.id === overId) ??
        currentBoard.columns.find((col) =>
          col.tasks.some((t) => t.id === overId)
        );
      if (!targetCol) return;

      const taskIndex = targetCol.tasks.findIndex((t) => t.id === activeId);
      if (taskIndex < 0) return;

      const position = computePosition(targetCol.tasks, taskIndex);

      queryClient.setQueryData<BoardData>(["board", projectId], (old) => {
        if (!old) return old;
        const columns = old.columns.map((col) => {
          if (col.id !== targetCol.id) return col;
          const tasks = col.tasks.map((t) =>
            t.id === activeId ? { ...t, position, column_id: targetCol.id } : t
          );
          return { ...col, tasks };
        });
        return { ...old, columns };
      });

      moveTask(activeId, targetCol.id, position).catch(() => {
        queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      });
    },
    [board, projectId, queryClient]
  );

  return { activeTask, handleDragStart, handleDragOver, handleDragEnd };
}

function computePosition(tasks: readonly TaskData[], index: number): string {
  if (tasks.length <= 1) return "0";

  const prev = index > 0 ? parseFloat(tasks[index - 1].position) : null;
  const next =
    index < tasks.length - 1 ? parseFloat(tasks[index + 1].position) : null;

  if (prev === null && next === null) return "0";
  if (prev === null && next !== null) return String(next - 1);
  if (prev !== null && next === null) return String(prev + 1);
  return String(((prev as number) + (next as number)) / 2);
}
