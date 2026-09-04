import { type ChangeEvent } from "react";

type Priority = "all" | "urgent" | "high" | "medium" | "low";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priority: Priority;
  onPriorityChange: (value: Priority) => void;
  assignee: string;
  onAssigneeChange: (v: string) => void;
  members: { user_id: string; full_name: string }[];
  dueDate: string;
  onDueDateChange: (v: string) => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const DUE_DATE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "none", label: "No date" },
];

export function FilterBar({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  members,
  dueDate,
  onDueDateChange,
}: FilterBarProps) {
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handlePriority = (e: ChangeEvent<HTMLSelectElement>) => {
    onPriorityChange(e.target.value as Priority);
  };

  const handleAssignee = (e: ChangeEvent<HTMLSelectElement>) => {
    onAssigneeChange(e.target.value);
  };

  const handleDueDate = (e: ChangeEvent<HTMLSelectElement>) => {
    onDueDateChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={handleSearch}
        className="w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm
                   placeholder:text-gray-400 focus:border-blue-500 focus:outline-none
                   focus:ring-1 focus:ring-blue-500
                   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200
                   dark:placeholder:text-gray-500"
      />
      <select
        value={priority}
        onChange={handlePriority}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm
                   text-gray-700 focus:border-blue-500 focus:outline-none
                   focus:ring-1 focus:ring-blue-500
                   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <select
        value={assignee}
        onChange={handleAssignee}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm
                   text-gray-700 focus:border-blue-500 focus:outline-none
                   focus:ring-1 focus:ring-blue-500
                   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        <option value="">All assignees</option>
        {members.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.full_name}
          </option>
        ))}
      </select>
      <select
        value={dueDate}
        onChange={handleDueDate}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm
                   text-gray-700 focus:border-blue-500 focus:outline-none
                   focus:ring-1 focus:ring-blue-500
                   dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        {DUE_DATE_OPTIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
