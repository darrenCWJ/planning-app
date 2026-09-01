import { type Project } from "../api";

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
}

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(project.id)}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="text-base font-semibold text-gray-900 leading-snug">
        {project.name}
      </h3>
      {project.description.length > 0 && (
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {project.description}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-400">
        Created {formatShortDate(project.created_at)}
      </p>
    </button>
  );
}
