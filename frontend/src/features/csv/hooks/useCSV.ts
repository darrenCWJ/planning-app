import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { importCSV, type CSVImportResult } from "../api";

export function useImportCSV(
  projectId: string
): UseMutationResult<CSVImportResult, Error, File> {
  return useMutation<CSVImportResult, Error, File>({
    mutationFn: (file: File) => importCSV(projectId, file),
  });
}
