import { useParams, Link } from "react-router-dom";
import { WebhookSettings } from "../components/WebhookSettings";

export function WebhookSettingsPage() {
  const { id: workspaceId = "" } = useParams<{ id: string }>();

  return (
    <div className="min-h-full bg-gray-900">
      <div className="border-b border-gray-700 px-6 py-4">
        <div className="mb-1">
          <Link
            to={`/workspaces/${workspaceId}`}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Workspace
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-sm text-gray-300">Settings</span>
        </div>
        <h1 className="text-lg font-semibold text-white">Workspace Settings</h1>
      </div>

      <WebhookSettings workspaceId={workspaceId} />
    </div>
  );
}
