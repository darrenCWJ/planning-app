import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWorkspace, useMembers, useWorkspaceProjects } from "../hooks/useWorkspace";
import { InviteMemberDialog } from "../components/InviteMemberDialog";
import { CreateProjectDialog } from "../../project/components/CreateProjectDialog";

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const workspaceId = id ?? "";

  const { data: workspace, isLoading, isError } = useWorkspace(workspaceId);
  const { data: members } = useMembers(workspaceId);
  const { data: projects } = useWorkspaceProjects(workspaceId);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800">
            Unable to load workspace
          </p>
          <p className="text-sm text-red-600 mt-1">
            The workspace may not exist or you don't have access.
          </p>
          <Link
            to="/"
            className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to workspaces
          </Link>
        </div>
      </div>
    );
  }

  const hasProjects = projects !== undefined && projects.length > 0;
  const hasMembers = members !== undefined && members.length > 0;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-1">
        <Link
          to="/"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Workspaces
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100
                       rounded-lg hover:bg-gray-200 transition-colors"
          >
            Invite member
          </button>
          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600
                       rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Create project
          </button>
        </div>
      </div>

      {/* Projects section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
        {hasProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/workspaces/${workspaceId}/projects/${project.id}/board`}
                className="group block rounded-xl border border-gray-200 bg-white p-5
                           hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-500">
              No projects in this workspace yet.
            </p>
          </div>
        )}
      </section>

      {/* Members section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>
        {hasMembers ? (
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full
                                   bg-gray-100 text-gray-600 text-xs font-bold">
                    {member.full_name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.full_name}
                    </p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No members found.</p>
        )}
      </section>

      {isInviteOpen && (
        <InviteMemberDialog
          workspaceId={workspaceId}
          onClose={() => setIsInviteOpen(false)}
        />
      )}

      {isCreateProjectOpen && (
        <CreateProjectDialog
          workspaceId={workspaceId}
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          onCreated={() => { setIsCreateProjectOpen(false); }}
        />
      )}
    </div>
  );
}
