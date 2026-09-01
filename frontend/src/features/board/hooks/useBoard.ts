import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { type BoardData, fetchBoard } from "../api";

export function useBoard(projectId: string): UseQueryResult<BoardData> {
  return useQuery<BoardData>({
    queryKey: ["board", projectId],
    queryFn: () => fetchBoard(projectId),
    enabled: projectId.length > 0,
  });
}
