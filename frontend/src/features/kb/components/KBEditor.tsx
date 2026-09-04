import { useCallback, useEffect, useRef, useState } from "react";
import { useUpdateKBPage } from "../hooks/useKB";
import type { KBPageData } from "../api";

interface KBEditorProps {
  workspaceId: string;
  page: KBPageData;
}

type Tab = "edit" | "preview";

function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Fenced code blocks
  html = html.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_m, _lang, code) =>
      `<pre class="bg-gray-800 rounded p-3 my-3 overflow-x-auto text-sm text-gray-200"><code>${code}</code></pre>`
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-700 rounded px-1 text-sm text-pink-300">$1</code>'
  );

  // Headings
  html = html.replace(
    /^#{6} (.+)$/gm,
    '<h6 class="text-sm font-semibold text-gray-200 mt-4 mb-1">$1</h6>'
  );
  html = html.replace(
    /^#{5} (.+)$/gm,
    '<h5 class="text-sm font-bold text-gray-100 mt-4 mb-1">$1</h5>'
  );
  html = html.replace(
    /^#{4} (.+)$/gm,
    '<h4 class="text-base font-bold text-gray-100 mt-4 mb-1">$1</h4>'
  );
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-bold text-gray-100 mt-5 mb-2">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-bold text-white mt-6 mb-2">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>'
  );

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="border-gray-600 my-4" />');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
  );

  // Unordered lists
  html = html.replace(/((?:^[*\-+] .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map(
        (line) =>
          `<li class="ml-4 list-disc">${line.replace(/^[*\-+] /, "")}</li>`
      )
      .join("");
    return `<ul class="my-2 space-y-1 text-gray-300">${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map(
        (line) =>
          `<li class="ml-4 list-decimal">${line.replace(/^\d+\. /, "")}</li>`
      )
      .join("");
    return `<ol class="my-2 space-y-1 text-gray-300">${items}</ol>`;
  });

  // Paragraphs — wrap non-empty lines not already wrapped in a block tag
  html = html.replace(
    /^(?!<[a-z])(.*\S.*)$/gm,
    '<p class="text-gray-300 my-2">$1</p>'
  );

  return html;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function KBEditor({ workspaceId, page }: KBEditorProps) {
  const [tab, setTab] = useState<Tab>("edit");
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const updatePage = useUpdateKBPage(workspaceId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state when a different page is selected
  useEffect(() => {
    setTitle(page.title);
    setContent(page.content);
  }, [page.id, page.title, page.content]);

  const saveContent = useCallback(
    (newContent: string) => {
      updatePage.mutate({ pageId: page.id, input: { content: newContent } });
    },
    [page.id, updatePage]
  );

  const saveTitle = useCallback(
    (newTitle: string) => {
      const trimmed = newTitle.trim();
      if (trimmed === "" || trimmed === page.title) return;
      updatePage.mutate({ pageId: page.id, input: { title: trimmed } });
    },
    [page.id, page.title, updatePage]
  );

  const handleContentChange = (value: string) => {
    setContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveContent(value), 2000);
  };

  const handleContentBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    saveContent(content);
  };

  const handleTitleBlur = () => {
    saveTitle(title);
  };

  const editorBy = page.updated_by_name ?? "Unknown";
  const editorTime = page.updated_at ?? page.created_at;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      {/* Title */}
      <div className="px-8 pt-8 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-600 outline-none border-none focus:ring-0"
          placeholder="Untitled Page"
        />
        <p className="mt-1 text-xs text-gray-500">
          Last edited by{" "}
          <span className="text-gray-400">{editorBy}</span>,{" "}
          {formatRelativeTime(editorTime)}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-4 border-b border-gray-800 flex items-end gap-4">
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "edit"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "preview"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          Preview
        </button>
        {updatePage.isPending && (
          <span className="ml-auto pb-2 text-xs text-gray-500">Saving…</span>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tab === "edit" ? (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={handleContentBlur}
            className="w-full h-full min-h-96 bg-transparent text-gray-200 text-sm leading-relaxed outline-none resize-none font-mono placeholder-gray-600"
            placeholder="Start writing in Markdown…"
            spellCheck
          />
        ) : (
          <div
            className="max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>
    </div>
  );
}
