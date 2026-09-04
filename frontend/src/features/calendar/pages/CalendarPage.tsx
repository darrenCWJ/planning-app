import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCalendar } from "../hooks/useCalendar";
import type { CalendarTask } from "../api";

type ViewMode = "month" | "week";

const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function hashProjectColor(projectId: string): string {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash * 31 + projectId.charCodeAt(i)) >>> 0;
  }
  return PROJECT_COLORS[hash % PROJECT_COLORS.length];
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function addWeeks(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + delta * 7);
  return d;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

interface TaskChipProps {
  task: CalendarTask;
  workspaceId: string;
  compact?: boolean;
}

function TaskChip({ task, workspaceId, compact = true }: TaskChipProps) {
  const navigate = useNavigate();
  const color = hashProjectColor(task.project_id);

  function handleClick() {
    navigate(
      `/workspaces/${workspaceId}/projects/${task.project_id}/board?task=${task.id}`
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        title={`${task.title} — ${task.project_name}`}
        className={`${color} text-white text-xs rounded px-1.5 py-0.5 truncate w-full text-left hover:opacity-80 transition-opacity`}
      >
        {task.title}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`${color} text-white text-sm rounded px-3 py-2 w-full text-left hover:opacity-80 transition-opacity`}
    >
      <div className="font-medium truncate">{task.title}</div>
      <div className="text-xs opacity-80 mt-0.5 flex items-center gap-2">
        <span>{task.project_key}</span>
        {task.priority && (
          <span>{PRIORITY_LABELS[task.priority] ?? task.priority}</span>
        )}
        <span className="ml-auto">{task.column_name}</span>
      </div>
    </button>
  );
}

interface MonthViewProps {
  currentDate: Date;
  tasksByDate: Map<string, CalendarTask[]>;
  workspaceId: string;
}

function MonthView({ currentDate, tasksByDate, workspaceId }: MonthViewProps) {
  const today = toDateString(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const cells: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-gray-700">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-400 py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {cells.map((cell) => {
          const dateStr = toDateString(cell);
          const tasks = tasksByDate.get(dateStr) ?? [];
          const isCurrentMonth = cell.getMonth() === currentMonth;
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              className={`min-h-24 border-b border-r border-gray-700 p-1 ${
                isCurrentMonth ? "bg-gray-800" : "bg-gray-900"
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday
                    ? "bg-blue-500 text-white"
                    : isCurrentMonth
                    ? "text-gray-200"
                    : "text-gray-600"
                }`}
              >
                {cell.getDate()}
              </div>
              <div className="space-y-0.5">
                {tasks.slice(0, 3).map((task) => (
                  <TaskChip
                    key={task.id}
                    task={task}
                    workspaceId={workspaceId}
                    compact
                  />
                ))}
                {tasks.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    +{tasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WeekViewProps {
  currentDate: Date;
  tasksByDate: Map<string, CalendarTask[]>;
  workspaceId: string;
}

function WeekView({ currentDate, tasksByDate, workspaceId }: WeekViewProps) {
  const today = toDateString(new Date());
  const weekStart = startOfWeek(currentDate);

  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex-1 overflow-auto space-y-2 p-4">
      {days.map((day) => {
        const dateStr = toDateString(day);
        const tasks = tasksByDate.get(dateStr) ?? [];
        const isToday = dateStr === today;

        return (
          <div key={dateStr} className="bg-gray-800 rounded-lg overflow-hidden">
            <div
              className={`px-4 py-2 flex items-center gap-2 border-b border-gray-700 ${
                isToday ? "bg-blue-900/40" : ""
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  isToday ? "text-blue-300" : "text-gray-200"
                }`}
              >
                {DAY_NAMES[day.getDay()]}
              </span>
              <span
                className={`text-sm ${
                  isToday ? "text-blue-400" : "text-gray-400"
                }`}
              >
                {MONTH_NAMES[day.getMonth()].slice(0, 3)} {day.getDate()}
              </span>
              {tasks.length > 0 && (
                <span className="ml-auto text-xs text-gray-500">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {tasks.length > 0 ? (
              <div className="p-3 space-y-2">
                {tasks.map((task) => (
                  <TaskChip
                    key={task.id}
                    task={task}
                    workspaceId={workspaceId}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-gray-600">No tasks</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CalendarPage() {
  const { id: workspaceId = "" } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const rangeStart =
    viewMode === "month"
      ? startOfMonth(currentDate)
      : startOfWeek(currentDate);
  const rangeEnd =
    viewMode === "month" ? endOfMonth(currentDate) : endOfWeek(currentDate);

  const startStr = toDateString(rangeStart);
  const endStr = toDateString(rangeEnd);

  const { data: tasks = [], isLoading, isError } = useCalendar(
    workspaceId,
    startStr,
    endStr
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      const existing = map.get(task.due_date) ?? [];
      map.set(task.due_date, [...existing, task]);
    }
    return map;
  }, [tasks]);

  function handlePrev() {
    if (viewMode === "month") {
      setCurrentDate((d) => addMonths(d, -1));
    } else {
      setCurrentDate((d) => addWeeks(d, -1));
    }
  }

  function handleNext() {
    if (viewMode === "month") {
      setCurrentDate((d) => addMonths(d, 1));
    } else {
      setCurrentDate((d) => addWeeks(d, 1));
    }
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  const heading =
    viewMode === "month"
      ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const ws = startOfWeek(currentDate);
          const we = endOfWeek(currentDate);
          if (ws.getMonth() === we.getMonth()) {
            return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
          }
          return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()]} ${we.getDate()}, ${ws.getFullYear()}`;
        })();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">{heading}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Today
          </button>
          <button
            onClick={handlePrev}
            aria-label="Previous"
            className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleNext}
            aria-label="Next"
            className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading…
        </div>
      )}

      {isError && (
        <div className="flex-1 flex items-center justify-center text-red-400">
          Failed to load calendar tasks.
        </div>
      )}

      {!isLoading && !isError && viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          tasksByDate={tasksByDate}
          workspaceId={workspaceId}
        />
      )}

      {!isLoading && !isError && viewMode === "week" && (
        <WeekView
          currentDate={currentDate}
          tasksByDate={tasksByDate}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}
