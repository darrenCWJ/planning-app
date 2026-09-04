import { useState, useEffect } from "react";
import { useTimeTracking } from "../hooks/useTimeTracking";
import type { TimeEntry } from "../api";

interface TimeTrackerProps {
  taskId: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return "<1m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface ElapsedTimerProps {
  startedAt: string;
}

function ElapsedTimer({ startedAt }: ElapsedTimerProps) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <span className="font-mono text-sm text-blue-400">{formatDuration(elapsed)}</span>;
}

export function TimeTracker({ taskId }: TimeTrackerProps) {
  const [description, setDescription] = useState("");
  const [isLoggingManual, setIsLoggingManual] = useState(false);
  const [manualDescription, setManualDescription] = useState("");
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");

  const {
    data: entries,
    isLoading,
    total,
    startMutation,
    stopMutation,
    logMutation,
    deleteMutation,
  } = useTimeTracking(taskId);

  const runningEntry: TimeEntry | undefined = entries?.find((e) => e.ended_at === null);

  const handleStartStop = () => {
    if (runningEntry) {
      stopMutation.mutate(runningEntry.id);
    } else {
      startMutation.mutate(description);
      setDescription("");
    }
  };

  const handleLogManual = () => {
    const hours = parseInt(manualHours || "0", 10);
    const minutes = parseInt(manualMinutes || "0", 10);
    const totalSeconds = hours * 3600 + minutes * 60;
    if (totalSeconds <= 0) return;
    logMutation.mutate({
      description: manualDescription,
      duration_seconds: totalSeconds,
      started_at: new Date().toISOString(),
    });
    setManualDescription("");
    setManualHours("");
    setManualMinutes("");
    setIsLoggingManual(false);
  };

  const isManualLogDisabled =
    logMutation.isPending ||
    (parseInt(manualHours || "0", 10) === 0 && parseInt(manualMinutes || "0", 10) === 0);

  if (isLoading) return <div className="text-sm text-gray-400">Loading...</div>;

  const totalSeconds = total?.total_seconds ?? 0;
  const completedEntries = entries?.filter((e) => e.ended_at !== null) ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Time Tracking</h4>
        {totalSeconds > 0 && (
          <span className="text-xs font-medium text-gray-400">
            Total: {formatDuration(totalSeconds)}
          </span>
        )}
      </div>

      {runningEntry ? (
        <div className="flex items-center justify-between rounded bg-gray-700 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm text-gray-300">
              {runningEntry.description || "Tracking..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ElapsedTimer startedAt={runningEntry.started_at} />
            <button
              type="button"
              onClick={handleStartStop}
              disabled={stopMutation.isPending}
              className="rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-500 disabled:opacity-50"
            >
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="flex-1 rounded bg-gray-700 px-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleStartStop}
            disabled={startMutation.isPending}
            className="rounded bg-green-600 px-2 py-1 text-sm text-white hover:bg-green-500 disabled:opacity-50"
          >
            Start
          </button>
        </div>
      )}

      {isLoggingManual ? (
        <div className="space-y-2 rounded bg-gray-700 p-2">
          <input
            type="text"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded bg-gray-600 px-2 py-1 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              placeholder="0"
              min={0}
              className="w-14 rounded bg-gray-600 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">h</span>
            <input
              type="number"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              placeholder="0"
              min={0}
              max={59}
              className="w-14 rounded bg-gray-600 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">m</span>
            <button
              type="button"
              onClick={handleLogManual}
              disabled={isManualLogDisabled}
              className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Log
            </button>
            <button
              type="button"
              onClick={() => setIsLoggingManual(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsLoggingManual(true)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          + Log time manually
        </button>
      )}

      {completedEntries.length > 0 && (
        <ul className="space-y-1">
          {completedEntries.map((entry) => (
            <li
              key={entry.id}
              className="group flex items-center justify-between rounded bg-gray-700 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-200">{entry.description || "—"}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatEntryDate(entry.started_at)}
                  </span>
                  {entry.duration_seconds != null && (
                    <span className="text-xs font-medium text-gray-400">
                      {formatDuration(entry.duration_seconds)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(entry.id)}
                disabled={deleteMutation.isPending}
                className="hidden text-gray-500 hover:text-red-400 group-hover:inline disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
