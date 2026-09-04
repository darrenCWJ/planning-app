import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  fetchBurndown,
  fetchVelocity,
  fetchWorkload,
  type BurndownPoint,
  type VelocityPoint,
  type WorkloadEntry,
} from "../api";

export function useBurndown(
  projectId: string,
  days: number
): UseQueryResult<BurndownPoint[]> {
  return useQuery<BurndownPoint[]>({
    queryKey: ["analytics", "burndown", projectId, days],
    queryFn: () => fetchBurndown(projectId, days),
    enabled: projectId.length > 0,
  });
}

export function useVelocity(
  projectId: string,
  weeks: number
): UseQueryResult<VelocityPoint[]> {
  return useQuery<VelocityPoint[]>({
    queryKey: ["analytics", "velocity", projectId, weeks],
    queryFn: () => fetchVelocity(projectId, weeks),
    enabled: projectId.length > 0,
  });
}

export function useWorkload(
  workspaceId: string
): UseQueryResult<WorkloadEntry[]> {
  return useQuery<WorkloadEntry[]>({
    queryKey: ["analytics", "workload", workspaceId],
    queryFn: () => fetchWorkload(workspaceId),
    enabled: workspaceId.length > 0,
  });
}
