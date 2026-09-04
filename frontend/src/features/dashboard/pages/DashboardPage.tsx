import { useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import type { DashboardTask } from "../api";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-red-500",
  high: "border-orange-500",
  medium: "border-yellow-500",
  low: "border-blue-500",
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function getDueDateColor(dueDateStr: string | null): string {
  if (!dueDateStr) return "text-gray-400";
  const due = new Date(dueDateStr);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  if (diff < 0) return "text-red-400";
  if (diff <= THREE_DAYS_MS) return "text-orange-400";
  return "text-gray-400";
}

function formatDueDate(dueDateStr: string | null): string {
  if (!dueDateStr) return "";
  const due = new Date(dueDateStr);
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface TaskRowProps {
  task: DashboardTask;
  onNavigate: (task: DashboardTask) => void;
}

function TaskRow({ task, onNavigate }: TaskRowProps) {
  const priorityBorder = task.priority
    ? (PRIORITY_COLORS[task.priority.toLowerCase()] ?? "border-gray-600")
    : "border-gray-600";
  const dueDateColor = getDueDateColor(task.due_date);

  return (
    <button
      type="button"
      onClick={() => onNavigate(task)}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-750 border-l-4 ${priorityBorder} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <span className="flex-1 text-sm text-gray-200 truncate">{task.title}</span>
      <span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono bg-gray-700 text-gray-300">
        {task.project_key}
      </span>
      {task.due_date && (
        <span className={`shrink-0 text-xs font-medium ${dueDateColor}`}>
          {formatDueDate(task.due_date)}
        </span>
      )}
    </button>
  );
}

interface SectionProps {
  title: string;
  headingColor: string;
  tasks: DashboardTask[];
  onNavigate: (task: DashboardTask) => void;
  emptyMessage: string;
}

function Section({ title, headingColor, tasks, onNavigate, emptyMessage }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className={`text-base font-semibold ${headingColor}`}>{title}</h2>
        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDashboard();

  function handleNavigate(task: DashboardTask) {
    navigate(`/workspaces/0/projects/${task.project_id}/board`);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading dashboard…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        Failed to load dashboard. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-8">My Dashboard</h1>
      <div className="flex flex-col gap-10 max-w-3xl">
        <Section
          title="Overdue"
          headingColor="text-red-400"
          tasks={data.overdue_tasks}
          onNavigate={handleNavigate}
          emptyMessage="No overdue tasks."
        />
        <Section
          title="Due This Week"
          headingColor="text-orange-400"
          tasks={data.due_this_week}
          onNavigate={handleNavigate}
          emptyMessage="Nothing due this week."
        />
        <Section
          title="All My Tasks"
          headingColor="text-gray-200"
          tasks={data.assigned_tasks}
          onNavigate={handleNavigate}
          emptyMessage="No tasks assigned to you."
        />
      </div>
    </div>
  );
}
