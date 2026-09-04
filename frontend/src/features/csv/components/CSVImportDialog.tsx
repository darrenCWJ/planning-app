import { useState, useRef } from "react";
import { useImportCSV } from "../hooks/useCSV";
import { parseCSVPreview } from "../api";

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEW_ROWS = 5;

export function CSVImportDialog({ projectId, isOpen, onClose }: Props) {
  const importMutation = useImportCSV(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportedCount(null);
    setError("");
    setPreviewRows([]);

    if (file) {
      try {
        const rows = await parseCSVPreview(file, PREVIEW_ROWS + 1);
        setPreviewRows(rows);
      } catch {
        setError("Could not read file. Please check it is a valid CSV.");
      }
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    setError("");

    try {
      const result = await importMutation.mutateAsync(selectedFile);
      setImportedCount(result.imported);
      setSelectedFile(null);
      setPreviewRows([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setError("Import failed. Please check the file format and try again.");
    }
  }

  function handleClose() {
    setSelectedFile(null);
    setPreviewRows([]);
    setImportedCount(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  }

  const headerRow = previewRows[0];
  const dataRows = previewRows.slice(1, PREVIEW_ROWS + 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Import CSV</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Import success result */}
          {importedCount !== null && (
            <div className="rounded-lg border border-green-700 bg-green-900/30 px-4 py-3">
              <p className="text-sm font-medium text-green-400">
                Successfully imported {importedCount} task
                {importedCount !== 1 ? "s" : ""}.
              </p>
            </div>
          )}

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select CSV file
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-md
                         file:border-0 file:bg-gray-700 file:px-4 file:py-2 file:text-sm
                         file:font-medium file:text-gray-200 hover:file:bg-gray-600
                         file:cursor-pointer file:transition-colors"
            />
          </div>

          {/* CSV preview */}
          {previewRows.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">
                Preview (first {Math.min(dataRows.length, PREVIEW_ROWS)} data rows)
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full text-xs">
                  {headerRow !== undefined && (
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-800">
                        {headerRow.map((cell, i) => (
                          <th
                            key={i}
                            className="px-3 py-2 text-left font-semibold text-gray-300 whitespace-nowrap"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {dataRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-b border-gray-800 last:border-0 even:bg-gray-800/30"
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-2 text-gray-400 whitespace-nowrap max-w-xs truncate"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error.length > 0 && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-700 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md px-4 py-2 text-sm text-gray-400 hover:text-gray-200
                       hover:bg-gray-800 transition-colors"
          >
            {importedCount !== null ? "Done" : "Cancel"}
          </button>
          {importedCount === null && (
            <button
              type="button"
              onClick={handleImport}
              disabled={selectedFile === null || importMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
