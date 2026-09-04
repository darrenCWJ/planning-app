import { useTaskActivity, useProjectActivity } from "../hooks/useActivity";
import { type ActivityData } from "../api";

interface ActivityFeedProps {
  taskId?: string;
  projectId?: string;
  type: "task" | "project";
}

function getRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function buildDescription(entry: ActivityData): string {
  const actor = entry.actor_name ?? "Someone";
  const details = entry.details;

  switch (entry.action) {
    case "created":
      return `${actor} created this ${entry.entity_type}`;

    case "updated": {
      if (
        details !== null &&
        typeof details.field === "string" &&
        details.old !== undefined &&
        details.new !== undefined
      ) {
        return `${actor} updated ${details.field} from ${String(details.old)} to ${String(details.new)}`;
      }
      return `${actor} updated this ${entry.entity_type}`;
    }

    case "moved": {
      if (details !== null && typeof details.to === "string") {
        return `${actor} moved this ${entry.entity_type} to ${details.to}`;
      }
      return `${actor} moved this ${entry.entity_type}`;
    }

    case "commented":
      return `${actor} commented on this ${entry.entity_type}`;

    case "assigned": {
      if (details !== null && typeof details.assignee_name === "string") {
        return `${actor} assigned this ${entry.entity_type} to ${details.assignee_name}`;
      }
      return `${actor} assigned this ${entry.entity_type}`;
    }

    case "archived":
      return `${actor} archived this ${entry.entity_type}`;

    default:
      return `${actor} performed ${entry.action} on this ${entry.entity_type}`;
  }
}

interface ActivityEntryProps {
  entry: ActivityData;
  isLast: boolean;
}

function ActivityEntry({ entry, isLast }: ActivityEntryProps) {
  const initials = getInitials(entry.actor_name);
  const description = buildDescription(entry);
  const relativeTime = getRelativeTime(entry.created_at);

  return (
    <div className="relative flex gap-3 pb-4">
      {!isLast && (
        <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-200" />
      )}
      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
        {initials}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <p className="text-sm text-gray-700">{description}</p>
        <p className="text-xs text-gray-400">{relativeTime}</p>
      </div>
    </div>
  );
}

function TaskActivityFeed({ taskId }: { taskId: string }) {
  const { data, isLoading, isError } = useTaskActivity(taskId);
  return <FeedContent isLoading={isLoading} isError={isError} entries={data} />;
}

function ProjectActivityFeed({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useProjectActivity(projectId);
  return <FeedContent isLoading={isLoading} isError={isError} entries={data} />;
}

interface FeedContentProps {
  isLoading: boolean;
  isError: boolean;
  entries: ActivityData[] | undefined;
}

function FeedContent({ isLoading, isError, entries }: FeedContentProps) {
  if (isLoading) {
    return <p className="text-xs text-gray-400">Loading activity...</p>;
  }
  if (isError) {
    return <p className="text-xs text-red-500">Failed to load activity.</p>;
  }
  if (!entries || entries.length === 0) {
    return <p className="text-xs text-gray-400">No activity yet.</p>;
  }
  return (
    <div className="border-l-2 border-gray-700 pl-0">
      {entries.map((entry, index) => (
        <ActivityEntry
          key={entry.id}
          entry={entry}
          isLast={index === entries.length - 1}
        />
      ))}
    </div>
  );
}

export function ActivityFeed({ taskId, projectId, type }: ActivityFeedProps) {
  return (
    <div className="mt-4">
      <h3 className="mb-3 text-sm font-medium text-gray-500">Activity</h3>
      {type === "task" && taskId != null ? (
        <TaskActivityFeed taskId={taskId} />
      ) : type === "project" && projectId != null ? (
        <ProjectActivityFeed projectId={projectId} />
      ) : null}
    </div>
  );
}
