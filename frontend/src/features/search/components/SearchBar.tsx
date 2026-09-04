import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";

const DEBOUNCE_DELAY_MS = 300;

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function SearchBar() {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { workspaceId = "" } = useParams<{ workspaceId: string }>();

  const debouncedQuery = useDebounce(inputValue, DEBOUNCE_DELAY_MS);
  const { data } = useSearch(workspaceId, debouncedQuery);

  const hasResults =
    data !== undefined &&
    data.projects.length > 0 &&
    data.projects.some((p) => p.tasks.length > 0);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2 && workspaceId) {
      setIsOpen(true);
    }
  }, [debouncedQuery, workspaceId]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setInputValue(value);
    if (value.length === 0) {
      setIsOpen(false);
    }
  }

  function handleTaskClick(projectId: string, taskId: string) {
    setIsOpen(false);
    setInputValue("");
    navigate(
      `/workspaces/${workspaceId}/projects/${projectId}/board?task=${taskId}`
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <svg
          className="absolute left-3 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (debouncedQuery.length >= 2) setIsOpen(true);
          }}
          placeholder="Search tasks... (Cmd+K)"
          className="w-full rounded-md bg-gray-700 py-1.5 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-400 outline-none ring-1 ring-gray-600 focus:ring-2 focus:ring-blue-500"
          aria-label="Search tasks"
          aria-expanded={isOpen && hasResults}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        <kbd className="absolute right-3 hidden rounded bg-gray-600 px-1.5 py-0.5 text-xs text-gray-400 sm:inline">
          ⌘K
        </kbd>
      </div>

      {isOpen && hasResults && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md bg-gray-800 shadow-lg ring-1 ring-gray-700"
          role="listbox"
          aria-label="Search results"
        >
          <ul className="max-h-80 overflow-y-auto py-1">
            {data!.projects.map((group) => {
              if (group.tasks.length === 0) return null;
              return (
                <li key={group.project_id}>
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {group.project_name}
                    <span className="ml-1 text-gray-500">({group.project_key})</span>
                  </div>
                  <ul>
                    {group.tasks.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => handleTaskClick(group.project_id, task.id)}
                          className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                          role="option"
                          aria-selected={false}
                        >
                          <span className="text-sm text-gray-200">{task.title}</span>
                          {task.priority && (
                            <span className="mt-0.5 text-xs text-gray-400">
                              Priority: {task.priority}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isOpen && debouncedQuery.length >= 2 && !hasResults && data !== undefined && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-gray-800 px-4 py-3 shadow-lg ring-1 ring-gray-700">
          <p className="text-sm text-gray-400">No tasks found for &ldquo;{debouncedQuery}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
