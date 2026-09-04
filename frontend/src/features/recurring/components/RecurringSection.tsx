import { useState } from "react";
import { useRecurring } from "../hooks/useRecurring";
import type { RRuleOption } from "../api";

interface RecurringSectionProps {
  taskId: string;
}

const RRULE_OPTIONS: { value: RRuleOption; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

function formatNextRun(nextRunAt: string | null): string {
  if (!nextRunAt) return "—";
  return new Date(nextRunAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecurringSection({ taskId }: RecurringSectionProps) {
  const [selectedRRule, setSelectedRRule] = useState<RRuleOption>("weekly");
  const { data: rules, isLoading, createMutation, deleteMutation } = useRecurring(taskId);

  if (isLoading) return <div className="text-sm text-gray-400">Loading...</div>;

  const activeRules = rules?.filter((r) => r.is_active) ?? [];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-300">Recurring</h4>

      {activeRules.length > 0 ? (
        <ul className="space-y-1">
          {activeRules.map((rule) => (
            <li
              key={rule.id}
              className="group flex items-center justify-between rounded bg-gray-700 px-2 py-1.5"
            >
              <div>
                <span className="text-sm capitalize text-gray-200">{rule.rrule}</span>
                <span className="ml-2 text-xs text-gray-500">
                  Next: {formatNextRun(rule.next_run_at)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(rule.id)}
                disabled={deleteMutation.isPending}
                className="hidden text-gray-500 hover:text-red-400 group-hover:inline disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500">No recurring schedule set.</p>
      )}

      <div className="flex gap-2">
        <select
          value={selectedRRule}
          onChange={(e) => setSelectedRRule(e.target.value as RRuleOption)}
          className="rounded bg-gray-700 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {RRULE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => createMutation.mutate(selectedRRule)}
          disabled={createMutation.isPending}
          className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {createMutation.isPending ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
