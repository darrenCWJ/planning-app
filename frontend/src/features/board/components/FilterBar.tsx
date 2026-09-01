import { type ChangeEvent } from "react";

type Priority = "all" | "urgent" | "high" | "medium" | "low";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  priority: Priority;
  onPriorityChange: (value: Priority) => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function FilterBar({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
}: FilterBarProps) {
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handlePriority = (e: ChangeEvent<HTMLSelectElement>) => {
    onPriorityChange(e.target.value as Priority);
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
                   focus:ring-1 focus:ring-blue-500"
      />
      <select
        value={priority}
        onChange={handlePriority}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm
                   text-gray-700 focus:border-blue-500 focus:outline-none
                   focus:ring-1 focus:ring-blue-500"
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
