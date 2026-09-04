import { useNavigate, useParams } from "react-router-dom";
import { KBTree } from "../components/KBTree";
import { KBEditor } from "../components/KBEditor";
import { useKBPage, useKBTree } from "../hooks/useKB";

export function KBPage() {
  const { id: workspaceId, pageId } = useParams<{
    id: string;
    pageId?: string;
  }>();
  const navigate = useNavigate();

  const { data: tree = [], isLoading: treeLoading } = useKBTree(
    workspaceId ?? ""
  );
  const { data: page, isLoading: pageLoading } = useKBPage(pageId ?? null);

  if (!workspaceId) return null;

  const handleSelect = (selectedPageId: string) => {
    navigate(`/workspaces/${workspaceId}/kb/${selectedPageId}`);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar tree */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 overflow-hidden">
        {treeLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-gray-500">Loading…</span>
          </div>
        ) : (
          <KBTree
            workspaceId={workspaceId}
            items={tree}
            activePageId={pageId ?? null}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {!pageId && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Select a page or create one
          </div>
        )}

        {pageId && pageLoading && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading page…
          </div>
        )}

        {pageId && !pageLoading && page && (
          <KBEditor workspaceId={workspaceId} page={page} />
        )}

        {pageId && !pageLoading && !page && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Page not found
          </div>
        )}
      </div>
    </div>
  );
}
