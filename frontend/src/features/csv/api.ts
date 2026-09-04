import { apiClient } from "../../lib/api-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface CSVImportResult {
  imported: number;
}

/**
 * Returns the full download URL for CSV export.
 * The caller is responsible for triggering the download (hidden anchor / window.open).
 */
export function getCSVExportUrl(projectId: string): string {
  return `${API_BASE_URL}/api/projects/${projectId}/export/csv`;
}

/**
 * Returns the auth token from localStorage for use in download links.
 */
export function getAuthToken(): string {
  return localStorage.getItem("access_token") ?? "";
}

export async function importCSV(
  projectId: string,
  file: File
): Promise<CSVImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const resp = await apiClient.post(
    `/api/projects/${projectId}/import/csv`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return resp.data.data ?? resp.data;
}

/**
 * Parse the first N rows of a CSV File for preview purposes.
 * Returns an array of row arrays (strings).
 */
export async function parseCSVPreview(
  file: File,
  maxRows = 6
): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve([]);
        return;
      }
      const lines = text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .slice(0, maxRows);
      const rows = lines.map((line) =>
        line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
      );
      resolve(rows);
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
