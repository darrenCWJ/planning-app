import { useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMembers, type WorkspaceMember } from "../../workspace/api";

interface AssigneePickerProps {
  workspaceId: string;
  value: string | null;
  onChange: (userId: string | null) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AssigneePicker({ workspaceId, value, onChange }: AssigneePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ["members", workspaceId],
    queryFn: () => fetchMembers(workspaceId),
    enabled: workspaceId.length > 0,
  });

  const selectedMember = members.find((m) => m.user_id === value) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm
                   hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {selectedMember != null ? (
          <>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
              {getInitials(selectedMember.full_name)}
            </span>
            <span className="text-gray-700">{selectedMember.full_name}</span>
          </>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50"
          >
            Unassigned
          </button>
          {members.map((member) => (
            <button
              key={member.user_id}
              type="button"
              onClick={() => {
                onChange(member.user_id);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                {getInitials(member.full_name)}
              </span>
              {member.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
