import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type WorkspaceMember } from "../../workspace/api";

interface MentionInputProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onChange"
  > {
  value: string;
  onChange: (v: string) => void;
  workspaceId: string;
}

export function MentionInput({
  value,
  onChange,
  workspaceId,
  ...rest
}: MentionInputProps) {
  const queryClient = useQueryClient();
  const [dropdownQuery, setDropdownQuery] = useState<string | null>(null);
  const atIndexRef = useRef<number>(-1);
  const cursorPosRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const members =
    queryClient.getQueryData<WorkspaceMember[]>(["members", workspaceId]) ?? [];

  const filteredMembers =
    dropdownQuery !== null
      ? members.filter((m) =>
          m.full_name.toLowerCase().includes(dropdownQuery.toLowerCase())
        )
      : [];

  function handleChange(
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? newValue.length;
    cursorPosRef.current = cursorPos;
    onChange(newValue);

    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([\w ]*)$/);
    if (atMatch) {
      atIndexRef.current = cursorPos - atMatch[0].length;
      setDropdownQuery(atMatch[1]);
    } else {
      atIndexRef.current = -1;
      setDropdownQuery(null);
    }
  }

  function handleSelect(member: WorkspaceMember): void {
    if (atIndexRef.current < 0) return;
    const before = value.slice(0, atIndexRef.current);
    const after = value.slice(cursorPosRef.current);
    const newValue =
      after.length === 0
        ? `${before}@${member.full_name} `
        : `${before}@${member.full_name} ${after.trimStart()}`;
    onChange(newValue);
    setDropdownQuery(null);
    atIndexRef.current = -1;
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void {
    if (e.key === "Escape" && dropdownQuery !== null) {
      setDropdownQuery(null);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...rest}
      />
      {dropdownQuery !== null && filteredMembers.length > 0 && (
        <ul className="absolute left-0 z-20 mt-1 max-h-48 w-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {filteredMembers.slice(0, 8).map((m) => (
            <li key={m.user_id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(m);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {m.full_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
