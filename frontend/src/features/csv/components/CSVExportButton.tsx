import { getCSVExportUrl, getAuthToken } from "../api";

interface Props {
  projectId: string;
}

/**
 * Triggers a CSV export download by fetching the export endpoint with the
 * auth token and using a hidden anchor to save the file.
 */
export function CSVExportButton({ projectId }: Props) {
  async function handleExport() {
    const url = getCSVExportUrl(projectId);
    const token = getAuthToken();

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `project-${projectId}-export.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch {
      // silently fail — caller can add error handling if needed
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      title="Export tasks as CSV"
      className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5
                 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800
                 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    >
      {/* Download icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
      Export
    </button>
  );
}
