import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTask,
  updateTask,
  deleteTask,
  fetchComments,
  createComment,
  type TaskData,
  type CommentData,
} from "../api";
import { type WorkspaceMember } from "../../workspace/api";
import { SubtaskList } from "../../subtask/components/SubtaskList";
import { ActivityFeed } from "../../activity/components/ActivityFeed";
import { AssigneePicker } from "./AssigneePicker";
import { AttachmentList } from "../../attachments/components/AttachmentList";
import { UploadZone } from "../../attachments/components/UploadZone";
import { MentionInput } from "./MentionInput";
import { RecurringSection } from "../../recurring/components/RecurringSection";
import { TimeTracker } from "../../timetracking/components/TimeTracker";
import { DependencyList } from "../../dependencies/components/DependencyList";

interface TaskDetailModalProps {
  taskId: string;
  projectId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;

export function TaskDetailModal({
  taskId,
  projectId,
  workspaceId,
  isOpen,
  onClose,
}: TaskDetailModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const { data: task, isLoading, isError } = useQuery<TaskData>({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    enabled: isOpen && taskId.length > 0,
  });

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState<string | null>(null);

  function enterEditMode(): void {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ?? "");
    setEditAssigneeId(task.assignee_id);
    setIsEditing(true);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      updateTask(taskId, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        due_date: editDueDate || null,
        assignee_id: editAssigneeId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", projectId] });
      handleClose();
    },
  });

  function handleClose(): void {
    setIsEditing(false);
    setIsConfirmingDelete(false);
    onClose();
  }

  const members =
    queryClient.getQueryData<WorkspaceMember[]>(["members", workspaceId]) ?? [];
  const assigneeName =
    task?.assignee_id != null
      ? (members.find((m) => m.user_id === task.assignee_id)?.full_name ?? task.assignee_id)
      : null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading task...</p>
        )}

        {isError && (
          <p className="text-sm text-red-600">Failed to load task.</p>
        )}

        {task && !isEditing && (
          <ViewMode
            task={task}
            projectId={projectId}
            workspaceId={workspaceId}
            assigneeName={assigneeName}
            onEdit={enterEditMode}
            onClose={handleClose}
            isConfirmingDelete={isConfirmingDelete}
            onToggleDelete={() => setIsConfirmingDelete((v) => !v)}
            onConfirmDelete={() => deleteMutation.mutate()}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {task && isEditing && (
          <EditMode
            workspaceId={workspaceId}
            editTitle={editTitle}
            editDescription={editDescription}
            editPriority={editPriority}
            editDueDate={editDueDate}
            editAssigneeId={editAssigneeId}
            onTitleChange={setEditTitle}
            onDescriptionChange={setEditDescription}
            onPriorityChange={setEditPriority}
            onDueDateChange={setEditDueDate}
            onAssigneeChange={setEditAssigneeId}
            onSave={() => updateMutation.mutate()}
            onCancel={() => setIsEditing(false)}
            isSaving={updateMutation.isPending}
            saveError={updateMutation.isError}
          />
        )}
      </div>
    </div>
  );
}

interface ViewModeProps {
  task: TaskData;
  projectId: string;
  workspaceId: string;
  assigneeName: string | null;
  onEdit: () => void;
  onClose: () => void;
  isConfirmingDelete: boolean;
  onToggleDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

function ViewMode({
  task,
  projectId,
  workspaceId,
  assigneeName,
  onEdit,
  onClose,
  isConfirmingDelete,
  onToggleDelete,
  onConfirmDelete,
  isDeleting,
}: ViewModeProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
        >
          X
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-gray-500 dark:text-gray-400">Priority</span>
          <span className="capitalize text-gray-800 dark:text-gray-200">{task.priority}</span>
        </div>

        {task.due_date != null && (
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-gray-500 dark:text-gray-400">Due date</span>
            <span className="text-gray-800 dark:text-gray-200">{task.due_date}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-gray-500 dark:text-gray-400">Assignee</span>
          <span className="text-gray-800 dark:text-gray-200">{assigneeName ?? "Unassigned"}</span>
        </div>

        <div className="text-sm">
          <span className="font-medium text-gray-500 dark:text-gray-400">Description</span>
          <p className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {task.description || "No description"}
          </p>
        </div>

        <SubtaskList taskId={task.id} />

        <DependencyList taskId={task.id} projectId={projectId} />

        <ActivityFeed taskId={task.id} type="task" />

        <div className="space-y-2">
          <AttachmentList taskId={task.id} />
          <UploadZone workspaceId={workspaceId} taskId={task.id} />
        </div>

        <RecurringSection taskId={task.id} />

        <TimeTracker taskId={task.id} />

        <CommentsSection taskId={task.id} workspaceId={workspaceId} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {!isConfirmingDelete ? (
            <button
              type="button"
              onClick={onToggleDelete}
              className="text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-500">Are you sure?</span>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={isDeleting}
                className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={onToggleDelete}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Edit
        </button>
      </div>
    </>
  );
}

interface EditModeProps {
  workspaceId: string;
  editTitle: string;
  editDescription: string;
  editPriority: string;
  editDueDate: string;
  editAssigneeId: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onAssigneeChange: (userId: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  saveError: boolean;
}

function EditMode({
  workspaceId,
  editTitle,
  editDescription,
  editPriority,
  editDueDate,
  editAssigneeId,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onDueDateChange,
  onAssigneeChange,
  onSave,
  onCancel,
  isSaving,
  saveError,
}: EditModeProps) {
  return (
    <>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h2>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Title</span>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Priority</span>
          <select
            value={editPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Assignee</span>
          <AssigneePicker
            workspaceId={workspaceId}
            value={editAssigneeId}
            onChange={onAssigneeChange}
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Description
          </span>
          <textarea
            value={editDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Due date</span>
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
        </label>

        {saveError && (
          <p className="text-sm text-red-600">
            Failed to save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || editTitle.trim().length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Mention highlight helpers ──────────────────────────────────────────────

function renderWithMentions(content: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Match @word or @word word (up to two words — covers most first+last name combos)
  const regex = /@\w+(?:\s+\w+)?/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      result.push(content.slice(lastIndex, match.index));
    }
    result.push(
      <span key={match.index} className="text-blue-500 font-medium">
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    result.push(content.slice(lastIndex));
  }

  return result.length > 0 ? result : [content];
}

// ── Comments section ───────────────────────────────────────────────────────

interface CommentsSectionProps {
  taskId: string;
  workspaceId: string;
}

function CommentBubble({
  comment,
  authorName,
}: {
  comment: CommentData;
  authorName: string;
}) {
  const initial = authorName.charAt(0).toUpperCase();
  return (
    <div className="flex gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-500 text-xs font-medium text-white">
        {initial}
      </div>
      <div className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm dark:bg-gray-700">
        <p className="mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          {authorName}
        </p>
        <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
          {renderWithMentions(comment.content)}
        </p>
      </div>
    </div>
  );
}

function CommentsSection({ taskId, workspaceId }: CommentsSectionProps) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [] } = useQuery<CommentData[]>({
    queryKey: ["comments", taskId],
    queryFn: () => fetchComments(taskId),
  });

  const members =
    queryClient.getQueryData<WorkspaceMember[]>(["members", workspaceId]) ?? [];

  const addMutation = useMutation({
    mutationFn: () => createComment(taskId, newComment.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      setNewComment("");
    },
  });

  function getAuthorName(authorId: string): string {
    return (
      members.find((m) => m.user_id === authorId)?.full_name ?? "Unknown"
    );
  }

  return (
    <div className="mt-2">
      <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
        Comments
      </h3>

      {comments.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {comments.map((c) => (
            <CommentBubble
              key={c.id}
              comment={c}
              authorName={getAuthorName(c.author_id)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <MentionInput
          value={newComment}
          onChange={setNewComment}
          workspaceId={workspaceId}
          placeholder="Add a comment… type @ to mention someone"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
          disabled={addMutation.isPending}
        />
        {addMutation.isError && (
          <p className="text-xs text-red-500">Failed to post comment. Please try again.</p>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || newComment.trim().length === 0}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {addMutation.isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
