import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCreateKBPage, useUpdateKBPage } from "../hooks/useKB";
import type { KBTreeItem } from "../api";

interface KBTreeProps {
  workspaceId: string;
  items: KBTreeItem[];
  activePageId: string | null;
  onSelect: (pageId: string) => void;
}

interface KBTreeNodeProps {
  item: KBTreeItem;
  activePageId: string | null;
  onSelect: (pageId: string) => void;
  onAddChild: (parentId: string) => void;
  onReorder: (parentId: string | null, activeId: string, overId: string) => void;
  depth: number;
}

function KBTreeNode({
  item,
  activePageId,
  onSelect,
  onAddChild,
  onReorder,
  depth,
}: KBTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children.length > 0;
  const isActive = item.id === activePageId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const childSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(item.id, active.id as string, over.id as string);
    }
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 rounded-md py-1 text-sm cursor-grab transition-colors ${
          isActive
            ? "bg-blue-900/50 text-blue-200"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: "8px" }}
        {...attributes}
        {...listeners}
      >
        <button
          type="button"
          aria-label={isExpanded ? "Collapse" : "Expand"}
          className={`w-4 h-4 flex-shrink-0 text-gray-500 hover:text-gray-300 transition-transform ${
            isExpanded ? "rotate-90" : ""
          } ${!hasChildren ? "invisible" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3 h-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <span
          className="flex-1 truncate"
          onClick={() => onSelect(item.id)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {item.title}
        </span>

        <button
          type="button"
          aria-label="Add child page"
          className="invisible group-hover:visible w-5 h-5 flex-shrink-0 text-gray-500 hover:text-gray-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(item.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <DndContext
          sensors={childSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChildDragEnd}
        >
          <SortableContext
            items={item.children.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {item.children.map((child) => (
                <KBTreeNode
                  key={child.id}
                  item={child}
                  activePageId={activePageId}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                  onReorder={onReorder}
                  depth={depth + 1}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </li>
  );
}

export function KBTree({
  workspaceId,
  items,
  activePageId,
  onSelect,
}: KBTreeProps) {
  const createPage = useCreateKBPage(workspaceId);
  const updatePage = useUpdateKBPage(workspaceId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleNewPage = (parentId: string | null = null) => {
    createPage.mutate(
      { title: "Untitled Page", content: "", parent_id: parentId },
      {
        onSuccess: (page) => {
          onSelect(page.id);
        },
      }
    );
  };

  const handleReorder = (
    parentId: string | null,
    activeId: string,
    overId: string
  ) => {
    const siblings =
      parentId === null ? items : findChildren(items, parentId) ?? [];

    const oldIndex = siblings.findIndex((s) => s.id === activeId);
    const newIndex = siblings.findIndex((s) => s.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...siblings];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reordered.forEach((page, idx) => {
      updatePage.mutate({ pageId: page.id, input: { position: idx + 1 } });
    });
  };

  const handleRootDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      handleReorder(null, active.id as string, over.id as string);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Pages
        </span>
        <button
          type="button"
          aria-label="New top-level page"
          className="text-gray-400 hover:text-gray-200 transition-colors"
          onClick={() => handleNewPage(null)}
          disabled={createPage.isPending}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-1 py-2">
        {items.length === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-500">
            No pages yet. Click + to create one.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRootDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                {items.map((item) => (
                  <KBTreeNode
                    key={item.id}
                    item={item}
                    activePageId={activePageId}
                    onSelect={onSelect}
                    onAddChild={(parentId) => handleNewPage(parentId)}
                    onReorder={handleReorder}
                    depth={0}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </nav>
    </div>
  );
}

function findChildren(
  items: KBTreeItem[],
  parentId: string
): KBTreeItem[] | null {
  for (const item of items) {
    if (item.id === parentId) return item.children;
    const found = findChildren(item.children, parentId);
    if (found) return found;
  }
  return null;
}
