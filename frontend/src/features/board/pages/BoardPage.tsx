import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useBoard } from "../hooks/useBoard";
import { useBoardWebSocket } from "../hooks/useBoardWebSocket";
import { useBoardDnd } from "../hooks/useBoardDnd";
import { BoardColumn } from "../components/BoardColumn";
import { CreateTaskDialog } from "../components/CreateTaskDialog";
import { TaskDetailModal } from "../components/TaskDetailModal";
import { TaskCard } from "../components/TaskCard";
import { FilterBar } from "../components/FilterBar";
import type { ColumnData } from "../api";

interface CreateDialogState {
  isOpen: boolean;
  columnId: string;
}

interface DetailModalState {
  isOpen: boolean;
  taskId: string;
}

const INITIAL_CREATE: CreateDialogState = { isOpen: false, columnId: "" };
const INITIAL_DETAIL: DetailModalState = { isOpen: false, taskId: "" };

type Priority = "all" | "urgent" | "high" | "medium" | "low";

function filterColumns(
  columns: ColumnData[],
  search: string,
  priority: Priority
): ColumnData[] {
  const lowerSearch = search.toLowerCase().trim();

  return columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) => {
      if (priority !== "all" && task.priority !== priority) return false;
      if (lowerSearch && !task.title.toLowerCase().includes(lowerSearch)) return false;
      return true;
    }),
  }));
}

export function BoardPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const { data: board, isLoading, isError } = useBoard(projectId);
  useBoardWebSocket(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { activeTask, handleDragStart, handleDragOver, handleDragEnd } =
    useBoardDnd(projectId, board);

  const [createDialog, setCreateDialog] = useState<CreateDialogState>(INITIAL_CREATE);
  const [detailModal, setDetailModal] = useState<DetailModalState>(INITIAL_DETAIL);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<Priority>("all");

  const filteredColumns = useMemo(
    () => (board ? filterColumns(board.columns, search, priority) : []),
    [board, search, priority]
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Loading board...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-600">
          Failed to load board. Please try again.
        </p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No board data available.</p>
      </div>
    );
  }

  const hasColumns = board.columns.length > 0;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="mb-1">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Workspaces
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Board</h1>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            priority={priority}
            onPriorityChange={setPriority}
          />
        </div>
      </header>

      {!hasColumns ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">
            No columns yet. Create workflow columns to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {filteredColumns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                onTaskClick={(taskId) =>
                  setDetailModal({ isOpen: true, taskId })
                }
                onAddTask={() =>
                  setCreateDialog({ isOpen: true, columnId: column.id })
                }
              />
            ))}

            <DragOverlay>
              {activeTask != null ? (
                <TaskCard task={activeTask} onClick={() => {}} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <CreateTaskDialog
        projectId={projectId}
        columnId={createDialog.columnId}
        isOpen={createDialog.isOpen}
        onClose={() => setCreateDialog(INITIAL_CREATE)}
      />

      <TaskDetailModal
        taskId={detailModal.taskId}
        projectId={projectId}
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal(INITIAL_DETAIL)}
      />
    </div>
  );
}
