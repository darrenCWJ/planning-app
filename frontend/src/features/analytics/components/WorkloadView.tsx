import { useWorkload } from "../hooks/useAnalytics";
import type { WorkloadEntry } from "../api";

interface WorkloadViewProps {
  workspaceId: string;
}

function WorkloadBar({ entry, maxCount }: { entry: WorkloadEntry; maxCount: number }) {
  const totalPct = maxCount > 0 ? (entry.task_count / maxCount) * 100 : 0;
  const activePct = maxCount > 0 ? (entry.active_count / maxCount) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-right text-sm text-gray-300">
        {entry.full_name}
      </span>
      <div className="relative h-6 flex-1 rounded overflow-hidden bg-gray-700">
        <div
          className="absolute inset-y-0 left-0 bg-gray-600 rounded"
          style={{ width: `${totalPct}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 rounded"
          style={{ width: `${activePct}%` }}
        />
      </div>
      <span className="w-20 shrink-0 text-sm text-gray-400">
        {entry.active_count} / {entry.task_count}
      </span>
    </div>
  );
}

export function WorkloadView({ workspaceId }: WorkloadViewProps) {
  const { data, isLoading, isError } = useWorkload(workspaceId);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-500">
        Loading workload...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-red-400">
        Failed to load workload data.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-500">
        No team members found.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((e) => e.task_count), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="w-32 shrink-0 text-right">Member</span>
        <div className="flex flex-1 gap-4 pl-0">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-blue-500" />
            Active tasks
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-gray-600" />
            Total tasks
          </span>
        </div>
      </div>
      {data.map((entry) => (
        <WorkloadBar key={entry.user_id} entry={entry} maxCount={maxCount} />
      ))}
    </div>
  );
}
