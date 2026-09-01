import { useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { CreateWorkspaceDialog } from "../components/CreateWorkspaceDialog";

export function WorkspaceListPage() {
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">
            Unable to load workspaces
          </p>
          <p className="text-sm text-red-600 mt-1">
            Something went wrong. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const hasWorkspaces = workspaces !== undefined && workspaces.length > 0;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize your projects into workspaces
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600
                     rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Create workspace
        </button>
      </div>

      {hasWorkspaces ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/workspaces/${ws.id}`}
              className="group block rounded-xl border border-gray-200 bg-white p-5
                         hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg
                                 bg-blue-50 text-blue-600 text-sm font-bold
                                 group-hover:bg-blue-100 transition-colors">
                  {ws.name.charAt(0).toUpperCase()}
                </span>
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {ws.name}
                </h2>
              </div>
              <p className="text-xs text-gray-400">
                Created {new Date(ws.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm font-medium text-gray-600">
            No workspaces yet
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first workspace to get started.
          </p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50
                       rounded-lg hover:bg-blue-100 transition-colors"
          >
            Create workspace
          </button>
        </div>
      )}

      {isDialogOpen && (
        <CreateWorkspaceDialog
          onClose={() => setIsDialogOpen(false)}
          onCreated={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
