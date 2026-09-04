import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllRead,
  type NotificationData,
} from "../api";

const NOTIFICATIONS_KEY = ["notifications"] as const;
const NOTIFICATIONS_COUNT_KEY = ["notifications-count"] as const;

export function useNotifications(): UseQueryResult<NotificationData[]> {
  return useQuery<NotificationData[]>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => fetchNotifications(20),
  });
}

export function useUnreadCount(): UseQueryResult<number> {
  return useQuery<number>({
    queryKey: NOTIFICATIONS_COUNT_KEY,
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
    },
  });
}

export function useMarkAllRead(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
    },
  });
}
