interface DueDateBadgeProps {
  dueDate: string | null;
}

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let colorClass = "bg-gray-700 text-gray-300";
  if (diffDays < 0) colorClass = "bg-red-900 text-red-300";
  else if (diffDays <= 3) colorClass = "bg-orange-900 text-orange-300";
  const formatted = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${colorClass}`}>
      {formatted}
    </span>
  );
}
