import { useQuery } from "@tanstack/react-query";
import { searchTasks } from "../api";

export function useSearch(workspaceId: string, query: string) {
  return useQuery({
    queryKey: ["search", workspaceId, query],
    queryFn: () => searchTasks(workspaceId, query),
    enabled: query.length >= 2 && workspaceId.length > 0,
  });
}
