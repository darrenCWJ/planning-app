import { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBoard } from "../hooks/useBoard";
import { useBoardWebSocket } from "../hooks/useBoardWebSocket";
import { useBoardDnd } from "../hooks/useBoardDnd";
import { BoardColumn } from "../components/BoardColumn";
import { CreateTaskDialog } from "../components/CreateTaskDialog";
import { TaskDetailModal } from "../components/TaskDetailModal";
import { TaskCard } from "../components/TaskCard";
import { FilterBar } from "../components/FilterBar";
import { ListView } from "../components/ListView";
import { SprintList } from "../../sprints/components/SprintList";
import { createColumn, updateColumn, deleteColumn, reorderColumns } from "../api";
import { fetchMembers, type WorkspaceMember } from "../../workspace/api";
import type { ColumnData } from "../api";
import { CSVExportButton } from "../../csv/components/CSVExportButton";
import { CSVImportDialog } from "../../csv/components/CSVImportDialog";

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
  priority: Priority,
  assignee: string,
  dueDate: string
): ColumnData[] {
  const lowerSearch = search.toLowerCase().trim();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) => {
      if (priority !== "all" && task.priority !== priority) return false;
      if (lowerSearch && !task.title.toLowerCase().includes(lowerSearch)) return false;
      if (assignee !== "" && task.assignee_id !== assignee) return false;
      if (dueDate !== "all") {
        if (dueDate === "none") {
          if (task.due_date != null) return false;
        } else {
          if (task.due_date == null) return false;
          const due = new Date(task.due_date);
          if (dueDate === "overdue" && due >= now) return false;
          if (dueDate === "today" && (due < now || due > todayEnd)) return false;
          if (dueDate === "week" && (due < now || due > weekEnd)) return false;
        }
      }
      return true;
    }),
  }));
}

export function BoardPage() {
  const { id: workspaceId = "", projectId = "" } = useParams<{
    id: string;
    projectId: string;
  }>();
  const { data: board, isLoading, isError } = useBoard(projectId);
  useBoardWebSocket(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const queryClient = useQueryClient();

  const { activeTask, handleDragStart, handleDragOver, handleDragEnd: handleTaskDragEnd } =
    useBoardDnd(projectId, board);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !board) {
        handleTaskDragEnd(event);
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId.startsWith("column-") && overId.startsWith("column-")) {
        const activeColId = activeId.replace("column-", "");
        const overColId = overId.replace("column-", "");
        if (activeColId === overColId) return;

        const columnIds = board.columns.map((c) => c.id);
        const oldIndex = columnIds.indexOf(activeColId);
        const newIndex = columnIds.indexOf(overColId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = [...columnIds];
        reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, activeColId);

        queryClient.setQueryData(["board", projectId], {
          ...board,
          columns: reordered.map((id) => board.columns.find((c) => c.id === id)!),
        });

        reorderColumns(projectId, reordered).catch(() => {
          queryClient.invalidateQueries({ queryKey: ["board", projectId] });
        });
        return;
      }

      handleTaskDragEnd(event);
    },
    [board, projectId, queryClient, handleTaskDragEnd]
  );

  const [createDialog, setCreateDialog] = useState<CreateDialogState>(INITIAL_CREATE);
  const [detailModal, setDetailModal] = useState<DetailModalState>(INITIAL_DETAIL);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<Priority>("all");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("all");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list" | "sprints">("board");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ["members", workspaceId],
    queryFn: () => fetchMembers(workspaceId),
    enabled: workspaceId.length > 0,
  });

  const invalidateBoard = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["board", projectId] }),
    [queryClient, projectId]
  );

  const createColumnMutation = useMutation({
    mutationFn: (name: string) => createColumn(projectId, { name }),
    onSuccess: invalidateBoard,
  });

  const handleRenameColumn = useCallback(
    async (columnId: string, name: string) => {
      await updateColumn(columnId, { name });
      invalidateBoard();
    },
    [invalidateBoard]
  );

  const handleDeleteColumn = useCallback(
    async (columnId: string) => {
      await deleteColumn(columnId);
      invalidateBoard();
    },
    [invalidateBoard]
  );

  const handleAddColumn = async () => {
    const trimmed = newColumnName.trim();
    if (trimmed.length === 0) return;
    await createColumnMutation.mutateAsync(trimmed);
    setNewColumnName("");
    setIsAddingColumn(false);
  };

  const filteredColumns = useMemo(
    () =>
      board
        ? filterColumns(board.columns, search, priority, assignee, dueDate)
        : [],
    [board, search, priority, assignee, dueDate]
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading board...</p>
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
        <p className="text-sm text-gray-500 dark:text-gray-400">No board data available.</p>
      </div>
    );
  }

  const hasColumns = board.columns.length > 0;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="mb-1">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300">
            Workspaces
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {viewMode === "board" ? "Board" : viewMode === "list" ? "List" : "Sprints"}
            </h1>
            <div className="flex overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "board"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`border-l border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors dark:border-gray-700 ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("sprints")}
                className={`border-l border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors dark:border-gray-700 ${
                  viewMode === "sprints"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Sprints
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CSVExportButton projectId={projectId} />
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              title="Import tasks from CSV"
              className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5
                         text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800
                         transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                         dark:hover:bg-gray-700 dark:hover:text-gray-100"
            >
              {/* Upload icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Import
            </button>
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              priority={priority}
              onPriorityChange={setPriority}
              assignee={assignee}
              onAssigneeChange={setAssignee}
              members={members}
              dueDate={dueDate}
              onDueDateChange={setDueDate}
            />
          </div>
        </div>
      </header>

      {viewMode === "sprints" ? (
        <div className="flex-1 overflow-y-auto p-6">
          <SprintList projectId={projectId} />
        </div>
      ) : !hasColumns ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No columns yet. Create workflow columns to get started.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <ListView
          columns={filteredColumns}
          onTaskClick={(taskId) => setDetailModal({ isOpen: true, taskId })}
          workspaceId={workspaceId}
        />
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredColumns.map((c) => `column-${c.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {filteredColumns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  workspaceId={workspaceId}
                  onTaskClick={(taskId) =>
                    setDetailModal({ isOpen: true, taskId })
                  }
                  onAddTask={() =>
                    setCreateDialog({ isOpen: true, columnId: column.id })
                  }
                  onRename={handleRenameColumn}
                  onDelete={handleDeleteColumn}
                />
              ))}
            </SortableContext>

            <div className="flex w-72 shrink-0 flex-col items-center justify-start pt-1">
              {isAddingColumn ? (
                <div className="w-full rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                  <input
                    autoFocus
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") {
                        setIsAddingColumn(false);
                        setNewColumnName("");
                      }
                    }}
                    placeholder="Column name..."
                    className="w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm
                               focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                               dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      disabled={createColumnMutation.isPending || newColumnName.trim().length === 0}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white
                                 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingColumn(false);
                        setNewColumnName("");
                      }}
                      className="rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3
                             text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700
                             transition-colors dark:border-gray-600 dark:text-gray-400
                             dark:hover:border-gray-500 dark:hover:text-gray-200"
                >
                  + Add column
                </button>
              )}
            </div>

            <DragOverlay>
              {activeTask != null ? (
                <TaskCard task={activeTask} onClick={() => {}} workspaceId={workspaceId} />
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
        workspaceId={workspaceId}
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal(INITIAL_DETAIL)}
      />

      <CSVImportDialog
        projectId={projectId}
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
}
