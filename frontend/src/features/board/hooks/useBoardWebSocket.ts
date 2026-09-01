import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { type BoardData, type TaskData } from "../api";

interface BoardWebSocketEvent {
  event: string;
  data: TaskData;
}

function isBoardEvent(value: unknown): value is BoardWebSocketEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "event" in value &&
    typeof (value as Record<string, unknown>).event === "string" &&
    "data" in value
  );
}

export function useBoardWebSocket(projectId: string): void {
  const queryClient = useQueryClient();
  const wsUrl = `${import.meta.env.VITE_WS_URL ?? "ws://localhost:8000"}/api/boards/${projectId}/live`;

  const handleMessage = useCallback(
    (raw: unknown) => {
      if (!isBoardEvent(raw)) return;

      queryClient.setQueryData<BoardData>(["board", projectId], (old) => {
        if (!old) return old;

        const columns = old.columns.map((col) => ({
          ...col,
          tasks: [...col.tasks],
        }));

        switch (raw.event) {
          case "task.created": {
            const col = columns.find((c) => c.id === raw.data.column_id);
            if (col) {
              col.tasks = [...col.tasks, raw.data];
            }
            break;
          }
          case "task.moved": {
            const columnsWithoutTask = columns.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== raw.data.id),
            }));
            const targetCol = columnsWithoutTask.find(
              (c) => c.id === raw.data.column_id
            );
            if (targetCol) {
              targetCol.tasks = [...targetCol.tasks, raw.data];
            }
            return { ...old, columns: columnsWithoutTask };
          }
          case "task.updated": {
            for (const col of columns) {
              const idx = col.tasks.findIndex((t) => t.id === raw.data.id);
              if (idx !== -1) {
                col.tasks = [
                  ...col.tasks.slice(0, idx),
                  raw.data,
                  ...col.tasks.slice(idx + 1),
                ];
                break;
              }
            }
            break;
          }
          case "task.archived": {
            for (const col of columns) {
              col.tasks = col.tasks.filter((t) => t.id !== raw.data.id);
            }
            break;
          }
          default:
            break;
        }

        return { ...old, columns };
      });
    },
    [projectId, queryClient]
  );

  useWebSocket(wsUrl, handleMessage);
}
